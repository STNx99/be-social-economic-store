import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { ProductInput } from "@/utils/schemas/product";

const TABLE_NAME = process.env.DYNAMODB_TABLE_PRODUCTS ?? "Product";

const sampleProducts: Array<
  Omit<ProductInput, "status"> & { id: string; status?: ProductInput["status"] }
> = [
  {
    id: "p1111111-1111-1111-1111-111111111111",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Hạt Cà Phê Công Bằng",
    description: "Hạt cà phê rang vừa, mẻ nhỏ từ các hợp tác xã địa phương.",
    price: 19.99,
    stock: 150,
    images: [
      "https://example.com/images/coffee-beans-1.png",
      "https://example.com/images/coffee-beans-2.png",
    ],
    category: "Thực phẩm & Đồ uống",
    status: "active",
  },
  {
    id: "p2222222-2222-2222-2222-222222222222",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Túi Tote Cotton Nhuộm Tự Nhiên",
    description: "Túi tote bền chắc được nhuộm bằng sắc tố thân thiện với môi trường.",
    price: 29.5,
    stock: 80,
    images: ["https://example.com/images/tote.png"],
    category: "Thời trang & Phụ kiện",
    status: "active",
  },
  {
    id: "p3333333-3333-3333-3333-333333333333",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Bộ Ba Xà Phòng Hữu Cơ",
    description: "Xà phòng thủ công hương sả và xô thơm.",
    price: 14.75,
    stock: 200,
    images: ["https://example.com/images/soap-trio.png"],
    category: "Sức khỏe & Làm đẹp",
    status: "active",
  },
  {
    id: "p4444444-4444-4444-4444-444444444444",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Sổ Tay Giấy Tái Chế",
    description: "Sổ tay khổ A5 làm từ 100% giấy tái chế.",
    price: 12.0,
    stock: 100,
    images: ["https://example.com/images/notebook.png"],
    category: "Văn phòng phẩm",
    status: "active",
  },
  {
    id: "p5555555-5555-5555-5555-555555555555",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Bộ Bàn Chải Tre",
    description: "Bộ 4 bàn chải đánh răng bằng tre có thể phân hủy sinh học.",
    price: 15.99,
    stock: 300,
    images: ["https://example.com/images/toothbrush.png"],
    category: "Sức khỏe & Làm đẹp",
    status: "active",
  },
  {
    id: "p6666666-6666-6666-6666-666666666666",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Khăn Choàng Len Dệt Tay",
    description: "Khăn choàng ấm áp được dệt tay bởi các nghệ nhân địa phương bằng len hữu cơ.",
    price: 45.0,
    stock: 40,
    images: ["https://example.com/images/scarf.png"],
    category: "Thời trang & Phụ kiện",
    status: "active",
  },
  {
    id: "p7777777-7777-7777-7777-777777777777",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Ly Cà Phê Gốm Sứ",
    description: "Ly gốm thủ công với lớp men độc đáo.",
    price: 22.5,
    stock: 60,
    images: ["https://example.com/images/mug.png"],
    category: "Nhà cửa & Đời sống",
    status: "active",
  },
  {
    id: "p8888888-8888-8888-8888-888888888888",
    sellerId: "00000000-0000-0000-0000-000000000000",
    name: "Hũ Mật Ong Hữu Cơ",
    description: "Mật ong nguyên chất, thô được thu hoạch từ các trang trại bền vững.",
    price: 18.0,
    stock: 120,
    images: ["https://example.com/images/honey.png"],
    category: "Thực phẩm & Đồ uống",
    status: "active",
  },
];

const buildProductItem = (
  base: Omit<ProductInput, "status"> & { id: string; status?: ProductInput["status"] },
) => ({
  id: base.id,
  sellerId: base.sellerId,
  name: base.name,
  description: base.description,
  price: base.price,
  stock: base.stock,
  images: base.images ?? [],
  category: base.category,
  status: base.status ?? "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

async function seedProducts() {
  if (!TABLE_NAME) {
    throw new Error("DynamoDB table name is not configured.");
  }

  console.info(
    `Seeding ${sampleProducts.length} products into table "${TABLE_NAME}"...`,
  );

  const putPromises = sampleProducts.map((product) => {
    const item = buildProductItem(product);
    return dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );
  });

  await Promise.all(putPromises);
  console.info("Product seed complete.");
}

if (import.meta.main) {
  seedProducts()
    .catch((err) => {
      console.error("Failed to seed products", err);
      throw err;
    })
    .finally(() => {
      if (typeof process !== "undefined" && process.exit) {
        process.exit(0);
      }
    });
}