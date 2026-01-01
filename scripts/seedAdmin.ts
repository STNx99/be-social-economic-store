import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const TABLE_NAME = process.env.DYNAMODB_TABLE_USER ?? "User";

const adminData = {
  email: "admin@socialstore.com",
  name: "System Administrator",
  password: "AdminPassword123!", // Meets PasswordSchema: min 8, upper, lower, number, special
  role: "admin",
};

async function seedAdmin() {
  if (!TABLE_NAME) {
    throw new Error("DynamoDB table name for users is not configured.");
  }

  console.info(`Seeding admin user "${adminData.email}" into table "${TABLE_NAME}"...`);

  try {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const item = {
      id: randomUUID(),
      email: adminData.email,
      name: adminData.name,
      password: hashedPassword,
      role: adminData.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    console.info("✅ Admin user seed complete.");
  } catch (error) {
    console.error("❌ Failed to seed admin user:", error);
    throw error;
  }
}

if (import.meta.main) {
  seedAdmin()
    .catch((err) => {
      console.error("Fatal error in admin seed script:", err);
      process.exit(1);
    })
    .finally(() => {
      if (typeof process !== "undefined" && process.exit) {
        process.exit(0);
      }
    });
}