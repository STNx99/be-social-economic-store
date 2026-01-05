import { Context } from "hono";
import { GoogleGenAI } from "@google/genai";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { StatusBuilder } from "@/utils";
import { Product } from "@/utils/schemas/product";

const ai = new GoogleGenAI({});

export class AIController {
  constructor(private productUseCase: IProductUseCase) {}

  async suggestProducts(c: Context) {
    try {
      const body = await c.req.json();
      const { query } = body as { query: string };

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return c.json(
          StatusBuilder.fail("Query is required and must be a non-empty string"),
          400,
        );
      }

      const productsResponse = await this.productUseCase.listProducts(
        {
          page: 1,
          limit: 100, 
          status: "active",
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        undefined,
        undefined,
      );

      if (!productsResponse.success || !productsResponse.data) {
        return c.json(
          StatusBuilder.fail("Failed to retrieve products"),
          500,
        );
      }

      const products = productsResponse.data;

      if (products.length === 0) {
        return c.json(
          StatusBuilder.ok({
            suggestions: "Hiện tại không có sản phẩm nào trong cửa hàng.",
            products: [],
          }),
          200,
        );
      }

      const productsContext = products
        .slice(0, 50)
        .map((product: Product) => {
          return `- ${product.name}${product.description ? `: ${product.description}` : ""} (Price: ${product.price.toLocaleString("en-US")}, Category: ${product.category || "N/A"})`;
        })
        .join("\n");

      const prompt = `You are a product consultation chatbot for an online store.
Your task is to provide advice and suggest suitable products based on customer requirements.

List of products currently available in the store:
${productsContext}

Customer request: "${query}"

Please analyze the request and suggest the most suitable products. Respond in English, be friendly and professional.
If no suitable products are found, suggest similar products or recommend that the customer expand their search criteria.`;

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const aiSuggestion = response.text || "Xin lỗi, tôi không thể tạo đề xuất vào lúc này.";

      const queryLower = query.toLowerCase();
      const relevantProducts = products
        .filter((product: Product) => {
          const nameMatch = product.name.toLowerCase().includes(queryLower);
          const descMatch = product.description?.toLowerCase().includes(queryLower);
          const categoryMatch = product.category?.toLowerCase().includes(queryLower);
          return nameMatch || descMatch || categoryMatch;
        })
        .slice(0, 10); 

      return c.json(
        StatusBuilder.ok({
          suggestions: aiSuggestion,
          products: relevantProducts.map((product: Product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            images: product.images,
            category: product.category,
            stock: product.stock,
          })),
        }),
        200,
      );
    } catch (error: unknown) {
      console.error("[AIController] Error in suggestProducts:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }
}

