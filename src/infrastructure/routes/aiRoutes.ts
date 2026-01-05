import { Hono } from "hono";
import { Container } from "@/infrastructure/dependencies/Container";
import { AIController } from "@/adapters/controllers/AIController";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";

export function setupAIRoutes(app: Hono) {
  const container = Container.getInstance();
  const productUseCase = container.getProductUseCase();
  const aiController = new AIController(productUseCase);

  app.post("/api/ai/suggest", (c) => aiController.suggestProducts(c));
}

