import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { InventoryItem, InventoryMovement } from "@/utils/schemas/inventory";
import { randomUUID } from "crypto";

const INVENTORY_TABLE = process.env.DYNAMODB_TABLE_INVENTORY ?? "Inventory";
const MOVEMENT_TABLE = process.env.DYNAMODB_TABLE_INVENTORY_MOVEMENT ?? "InventoryMovement";

const sampleInventory: Array<Partial<InventoryItem>> = [
  {
    id: "inv-1111111-1111-1111-1111-111111111111",
    variantId: "v1111111-1111-1111-1111-111111111111",
    variantSku: "COFFEE-001",
    productId: "p1111111-1111-1111-1111-111111111111",
    productName: "Hạt Cà Phê Công Bằng",
    category: "Thực phẩm & Đồ uống",
    stock: 150,
    reserved: 10,
    available: 140,
    minStock: 20,
    maxStock: 500,
    status: "in_stock",
  },
  {
    id: "inv-2222222-2222-2222-2222-222222222222",
    variantId: "v2222222-2222-2222-2222-222222222222",
    variantSku: "TOTE-001",
    productId: "p2222222-2222-2222-2222-222222222222",
    productName: "Túi Tote Cotton Nhuộm Tự Nhiên",
    category: "Thời trang & Phụ kiện",
    stock: 80,
    reserved: 5,
    available: 75,
    minStock: 10,
    maxStock: 200,
    status: "in_stock",
  },
  {
    id: "inv-3333333-3333-3333-3333-333333333333",
    variantId: "v3333333-3333-3333-3333-333333333333",
    variantSku: "SOAP-001",
    productId: "p3333333-3333-3333-3333-333333333333",
    productName: "Bộ Ba Xà Phòng Hữu Cơ",
    category: "Sức khỏe & Làm đẹp",
    stock: 5,
    reserved: 2,
    available: 3,
    minStock: 10,
    maxStock: 100,
    status: "low_stock",
  },
  {
    id: "inv-4444444-4444-4444-4444-444444444444",
    variantId: "v4444444-4444-4444-4444-444444444444",
    variantSku: "NOTEBOOK-001",
    productId: "p4444444-4444-4444-4444-444444444444",
    productName: "Sổ Tay Giấy Tái Chế",
    category: "Văn phòng phẩm",
    stock: 0,
    reserved: 0,
    available: 0,
    minStock: 5,
    maxStock: 50,
    status: "out_of_stock",
  }
];

const sampleMovements: Array<Partial<InventoryMovement>> = [
  {
    id: randomUUID(),
    variantId: "v1111111-1111-1111-1111-111111111111",
    type: "in",
    quantity: 100,
    reason: "purchase",
    note: "Initial stock purchase",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
  },
  {
    id: randomUUID(),
    variantId: "v1111111-1111-1111-1111-111111111111",
    type: "out",
    quantity: 10,
    reason: "sale",
    note: "Order #ORD-123",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: randomUUID(),
    variantId: "v3333333-3333-3333-3333-333333333333",
    type: "out",
    quantity: 2,
    reason: "damaged",
    note: "Damaged during shipping",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
  }
];

async function seedInventory() {
  console.info(`Seeding inventory into table "${INVENTORY_TABLE}"...`);

  const inventoryPromises = sampleInventory.map((item) => {
    const fullItem: InventoryItem = {
      id: item.id!,
      variantId: item.variantId!,
      variantSku: item.variantSku!,
      productId: item.productId!,
      productName: item.productName!,
      category: item.category!,
      stock: item.stock!,
      reserved: item.reserved!,
      available: item.available!,
      minStock: item.minStock!,
      maxStock: item.maxStock!,
      status: item.status!,
      lastUpdated: new Date().toISOString(),
    };

    return dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: INVENTORY_TABLE,
        Item: fullItem,
      })
    );
  });

  await Promise.all(inventoryPromises);
  console.info("Inventory items seeded.");

  console.info(`Seeding movements into table "${MOVEMENT_TABLE}"...`);
  const movementPromises = sampleMovements.map((m) => {
    const fullMovement: InventoryMovement = {
      id: m.id!,
      variantId: m.variantId!,
      type: m.type!,
      quantity: m.quantity!,
      reason: m.reason!,
      note: m.note,
      createdAt: m.createdAt!,
    };

    return dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: MOVEMENT_TABLE,
        Item: fullMovement,
      })
    );
  });

  await Promise.all(movementPromises);
  console.info("Inventory movements seeded.");
}

if (import.meta.main) {
  seedInventory()
    .catch((err) => {
      console.error("Failed to seed inventory", err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}