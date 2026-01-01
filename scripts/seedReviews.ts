import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient, DYNAMODB_TABLES } from "@/infrastructure/database";
import { Review } from "@/utils/schemas/review";
import { randomUUID } from "crypto";

const TABLE_NAME = DYNAMODB_TABLES.REVIEW || "Review";

const sampleReviews: Array<Partial<Review>> = [
  {
    id: randomUUID(),
    productId: "p1111111-1111-1111-1111-111111111111",
    userId: "u1111111-1111-1111-1111-111111111111",
    userName: "Nguyễn Văn A",
    orderId: "o1111111-1111-1111-1111-111111111111",
    rating: 5,
    comment: "Cà phê rất thơm và ngon, đóng gói cẩn thận. Sẽ ủng hộ tiếp!",
    images: ["https://example.com/images/review-coffee.jpg"],
    verifiedPurchase: true,
    helpfulCount: 12,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString() as any,
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() as any,
  },
  {
    id: randomUUID(),
    productId: "p1111111-1111-1111-1111-111111111111",
    userId: "u2222222-2222-2222-2222-222222222222",
    userName: "Trần Thị B",
    orderId: "o2222222-2222-2222-2222-222222222222",
    rating: 4,
    comment: "Giao hàng hơi chậm một chút nhưng chất lượng cà phê tuyệt vời.",
    images: [],
    verifiedPurchase: true,
    helpfulCount: 5,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString() as any,
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString() as any,
  },
  {
    id: randomUUID(),
    productId: "p2222222-2222-2222-2222-222222222222",
    userId: "u1111111-1111-1111-1111-111111111111",
    userName: "Nguyễn Văn A",
    orderId: "o3333333-3333-3333-3333-333333333333",
    rating: 5,
    comment: "Túi tote rất đẹp, vải dày dặn và màu sắc tự nhiên rất ưng ý.",
    images: ["https://example.com/images/review-tote.jpg"],
    verifiedPurchase: true,
    helpfulCount: 8,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString() as any,
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() as any,
  }
];

async function seedReviews() {
  if (!TABLE_NAME) {
    throw new Error("DynamoDB table name for Review is not configured.");
  }

  console.info(`Seeding reviews into table "${TABLE_NAME}"...`);

  const putPromises = sampleReviews.map((review) => {
    const item = {
      ...review,
      id: review.id || randomUUID(),
      verifiedPurchase: review.verifiedPurchase ?? true,
      helpfulCount: review.helpfulCount ?? 0,
      images: review.images ?? [],
      createdAt: review.createdAt || new Date().toISOString(),
      updatedAt: review.updatedAt || new Date().toISOString(),
    };

    return dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
  });

  await Promise.all(putPromises);
  console.info(`Successfully seeded ${sampleReviews.length} reviews.`);
}

if (import.meta.main) {
  seedReviews()
    .catch((err) => {
      console.error("Failed to seed reviews", err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}