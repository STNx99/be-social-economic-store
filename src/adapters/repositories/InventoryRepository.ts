import { IInventoryRepository } from "@/domain/repositories/IInventoryRepository";
import {
  InventoryItem,
  InventoryMovement,
  SlowMovingItem,
} from "@/utils/schemas/inventory";
import { Product } from "@/utils/schemas/product";
import { ProductVariant } from "@/utils/schemas/productVariant";
import {
  dynamoDBDocumentClient,
  DYNAMODB_TABLES,
} from "@/infrastructure/database";
import {
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class InventoryRepository extends BaseRepository implements IInventoryRepository {
  private inventoryTable: string;
  private movementTable: string;
  private productTable: string;
  private variantTable: string;

  constructor() {
    super();
    this.inventoryTable = DYNAMODB_TABLES.INVENTORY || "Inventory";
    this.movementTable = DYNAMODB_TABLES.INVENTORY_MOVEMENT || "InventoryMovement";
    this.productTable = DYNAMODB_TABLES.PRODUCT || "Product";
    this.variantTable = process.env.DYNAMODB_TABLE_PRODUCT_VARIANTS ?? "Variant";

    if (!DYNAMODB_TABLES.INVENTORY) {
      console.warn(
        `[InventoryRepository] DYNAMODB_TABLE_INVENTORY not set, defaulting to "${this.inventoryTable}".`,
      );
    }
  }

  async findByVariantId(variantId: string): Promise<InventoryItem | null> {
    const res = (await dynamoDBDocumentClient.send(
      new ScanCommand({
        TableName: this.inventoryTable,
        FilterExpression: "variantId = :variantId",
        ExpressionAttributeValues: { ":variantId": variantId },
        Limit: 1,
      }),
    )) as DynamoDBResult;

    return (res.Items?.[0] as InventoryItem) || null;
  }

  async findByProductId(productId: string): Promise<InventoryItem[]> {
    const res = (await dynamoDBDocumentClient.send(
      new ScanCommand({
        TableName: this.inventoryTable,
        FilterExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
      }),
    )) as DynamoDBResult;

    return (res.Items as InventoryItem[]) || [];
  }

  async findAll(): Promise<InventoryItem[]> {
    const items: InventoryItem[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const res = (await dynamoDBDocumentClient.send(
        new ScanCommand({
          TableName: this.inventoryTable,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      )) as DynamoDBResult;

      if (res.Items) {
        items.push(...(res.Items as InventoryItem[]));
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
  }

  async save(inventory: InventoryItem): Promise<InventoryItem> {
    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.inventoryTable,
        Item: this.prepareItem(inventory),
      }),
    );
    return inventory;
  }

  async deleteByVariantId(variantId: string): Promise<boolean> {
    const item = await this.findByVariantId(variantId);
    if (!item) return false;

    const res = (await dynamoDBDocumentClient.send(
      new DeleteCommand({
        TableName: this.inventoryTable,
        Key: { id: item.id },
        ReturnValues: "ALL_OLD",
      }),
    )) as DynamoDBResult;

    return !!res.Attributes;
  }

  async saveMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.movementTable,
        Item: this.prepareItem(movement),
      }),
    );
    return movement;
  }

  async findMovementsByVariantId(
    variantId: string,
  ): Promise<InventoryMovement[]> {
    const res = (await dynamoDBDocumentClient.send(
      new ScanCommand({
        TableName: this.movementTable,
        FilterExpression: "variantId = :variantId",
        ExpressionAttributeValues: { ":variantId": variantId },
      }),
    )) as DynamoDBResult;

    return (res.Items as InventoryMovement[]) || [];
  }

  async getSlowMovingItems(daysThreshold: number): Promise<SlowMovingItem[]> {
    const allInventory = await this.findAll();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const slowMovingItems: SlowMovingItem[] = [];

    for (const item of allInventory) {
      const lastUpdated = new Date(item.lastUpdated);

      if (lastUpdated < thresholdDate && item.stock > 0) {
        slowMovingItems.push({
          variantId: item.variantId,
          productName: item.productName,
          category: item.category,
          stock: item.stock,
          daysSinceLastSale: Math.floor(
            (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24),
          ),
          totalValue: 0,
        });
      }
    }

    return slowMovingItems;
  }

  async adjustInventoryWithTransaction(
    inventoryItem: InventoryItem,
    movement: InventoryMovement,
    variant: ProductVariant,
    product: Product,
  ): Promise<void> {
    const transactItems: any[] = [
      {
        Put: {
          TableName: this.inventoryTable,
          Item: this.prepareItem(inventoryItem),
        },
      },
      {
        Put: {
          TableName: this.movementTable,
          Item: this.prepareItem(movement),
        },
      },
      {
        Put: {
          TableName: this.variantTable,
          Item: this.prepareItem(variant),
        },
      },
      {
        Put: {
          TableName: this.productTable,
          Item: this.prepareItem(product),
        },
      },
    ];

    await this.executeTransactionWithRetry(transactItems);
  }
}