import { IInventoryRepository } from "@/domain/repositories/IInventoryRepository";
import { 
  InventoryItem, 
  InventoryMovement, 
  SlowMovingItem 
} from "@/utils/schemas/inventory";
import { 
  dynamoDBDocumentClient, 
  DYNAMODB_TABLES 
} from "@/infrastructure/database";
import { 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand, 
  DeleteCommand 
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class InventoryRepository implements IInventoryRepository {
  private inventoryTable: string;
  private movementTable: string;
  private productIdIndex: string;
  private movementVariantIdIndex: string;

  constructor() {
    this.inventoryTable = DYNAMODB_TABLES.INVENTORY || "Inventory";
    this.movementTable = process.env.DYNAMODB_TABLE_INVENTORY_MOVEMENT || "InventoryMovement";
    this.productIdIndex = process.env.DYNAMODB_INVENTORY_PRODUCT_ID_INDEX || "productId-index";
    this.movementVariantIdIndex = process.env.DYNAMODB_MOVEMENT_VARIANT_ID_INDEX || "variantId-index";

    if (!DYNAMODB_TABLES.INVENTORY) {
      console.warn(
        `[InventoryRepository] DYNAMODB_TABLE_INVENTORY not set, defaulting to "${this.inventoryTable}".`,
      );
    }
  }

  async findByVariantId(variantId: string): Promise<InventoryItem | null> {
    const res = (await dynamoDBDocumentClient.send(
      new GetCommand({
        TableName: this.inventoryTable,
        Key: { variantId },
      })
    )) as DynamoDBResult;

    return (res.Item as InventoryItem) || null;
  }

  async findByProductId(productId: string): Promise<InventoryItem[]> {
    const res = (await dynamoDBDocumentClient.send(
      new QueryCommand({
        TableName: this.inventoryTable,
        IndexName: this.productIdIndex,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
      })
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
        })
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
        Item: inventory,
      })
    );
    return inventory;
  }

  async deleteByVariantId(variantId: string): Promise<boolean> {
    const res = (await dynamoDBDocumentClient.send(
      new DeleteCommand({
        TableName: this.inventoryTable,
        Key: { variantId },
        ReturnValues: "ALL_OLD",
      })
    )) as DynamoDBResult;

    return !!res.Attributes;
  }

  async saveMovement(movement: InventoryMovement): Promise<InventoryMovement> {
    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.movementTable,
        Item: movement,
      })
    );
    return movement;
  }

  async findMovementsByVariantId(variantId: string): Promise<InventoryMovement[]> {
    // Assuming variantId is either the Partition Key or has a GSI
    const res = (await dynamoDBDocumentClient.send(
      new QueryCommand({
        TableName: this.movementTable,
        IndexName: this.movementVariantIdIndex,
        KeyConditionExpression: "variantId = :variantId",
        ExpressionAttributeValues: { ":variantId": variantId },
      })
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
          variantName: item.variantName,
          stock: item.stock,
          daysSinceLastSale: Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)),
          totalValue: 0, // Value calculation would require price data from Product/Variant repository
        });
      }
    }

    return slowMovingItems;
  }
}