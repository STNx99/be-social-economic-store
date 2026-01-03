import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ProductVariant } from "@/utils/schemas/productVariant";
import { InventoryItem } from "@/utils/schemas/inventory";
import { IProductVariantRepository } from "../../domain/repositories/IProductVariantRepository";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class ProductVariantRepository extends BaseRepository implements IProductVariantRepository {
  private tableName: string;
  private productIdIndex: string;
  private skuIndex: string;
  private inventoryTableName: string;

  constructor() {
    super();
    this.tableName =
      process.env.DYNAMODB_TABLE_PRODUCT_VARIANTS ?? "Variant";
    this.productIdIndex =
      process.env.DYNAMODB_PRODUCT_VARIANTS_PRODUCT_ID_INDEX ??
      "ProductIdIndex";
    this.skuIndex =
      process.env.DYNAMODB_PRODUCT_VARIANTS_SKU_INDEX ?? "SkuIndex";
    this.inventoryTableName = process.env.DYNAMODB_TABLE_INVENTORY ?? "Inventory";
  }

  private itemToVariant(item: Record<string, unknown>): ProductVariant {
    return {
      id: (item.id || item.Id) as string,
      productId: item.productId as string,
      sku: item.sku as string,
      name: item.name as string,
      price: item.price as number,
      stock: item.stock as number,
      attributes: (item.attributes as Record<string, string>) || {},
      imageUrl: item.imageUrl as string | undefined,
      isActive: item.isActive as boolean,
      createdAt: item.createdAt
        ? new Date(item.createdAt as string)
        : new Date(),
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt as string)
        : new Date(),
    };
  }

  async findById(id: string): Promise<ProductVariant | null> {
    try {
      const cmd = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });
      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Item) return this.itemToVariant(res.Item);
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const cmd = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });
        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (res.Item) return this.itemToVariant(res.Item);
      }
    }
    return null;
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    try {
      const cmd = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.productIdIndex,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      return (res.Items ?? []).map((item) =>
        this.itemToVariant(item as Record<string, unknown>),
      );
    } catch (error: any) {
      if (error.name === "ValidationException" || error.message?.includes("index")) {
        const cmd = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "productId = :productId",
          ExpressionAttributeValues: { ":productId": productId },
        });
        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        return (res.Items ?? []).map((item) =>
          this.itemToVariant(item as Record<string, unknown>),
        );
      }
      throw error;
    }
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    try {
      const cmd = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.skuIndex,
        KeyConditionExpression: "sku = :sku",
        ExpressionAttributeValues: { ":sku": sku },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (!res.Items || res.Items.length === 0) return null;
      return this.itemToVariant(res.Items[0] as Record<string, unknown>);
    } catch (error: any) {
      if (error.name === "ValidationException" || error.message?.includes("index")) {
        const cmd = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "sku = :sku",
          ExpressionAttributeValues: { ":sku": sku },
        });
        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (!res.Items || res.Items.length === 0) return null;
        return this.itemToVariant(res.Items[0] as Record<string, unknown>);
      }
      throw error;
    }
  }

  async save(variant: ProductVariant): Promise<ProductVariant> {
    try {
      const item = this.prepareItem(variant);

      console.log(`[ProductVariantRepository] Saving item to ${this.tableName}:`, JSON.stringify(item, null, 2));

      await dynamoDBDocumentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...variant,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
      };
    } catch (error: unknown) {
      const awsError = error as {
        name?: string;
        code?: string;
        message?: string;
      };
      if (
        awsError?.name === "ResourceNotFoundException" ||
        awsError?.code === "ResourceNotFoundException" ||
        awsError?.message?.includes(
          "Cannot do operations on a non-existent table",
        )
      ) {
        throw new Error(
          `DynamoDB table "${this.tableName}" does not exist. Please create the table first.`,
        );
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const res = (await dynamoDBDocumentClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id },
          ReturnValues: "ALL_OLD",
        }),
      )) as DynamoDBResult;
      return !!res.Attributes;
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const res = (await dynamoDBDocumentClient.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: { Id: id },
            ReturnValues: "ALL_OLD",
          }),
        )) as DynamoDBResult;
        return !!res.Attributes;
      }
      throw error;
    }
  }

  async createVariantWithInventory(
    variant: ProductVariant,
    inventory: InventoryItem,
  ): Promise<ProductVariant> {
    const variantItem = this.prepareItem(variant);

    const transactItems: any[] = [
      {
        Put: {
          TableName: this.tableName,
          Item: variantItem,
        },
      },
      {
        Put: {
          TableName: this.inventoryTableName,
          Item: this.prepareItem({
            ...inventory,
            lastUpdated: inventory.lastUpdated || new Date().toISOString(),
          }),
        },
      },
    ];

    await this.executeTransactionWithRetry(transactItems);

    return {
      ...variant,
      createdAt: new Date(variantItem.createdAt as string),
      updatedAt: new Date(variantItem.updatedAt as string),
    };
  }

  async deleteVariantWithInventory(variantId: string): Promise<boolean> {
    try {
      const inventoryRes = (await dynamoDBDocumentClient.send(
        new ScanCommand({
          TableName: this.inventoryTableName,
          FilterExpression: "variantId = :variantId",
          ExpressionAttributeValues: { ":variantId": variantId },
          Limit: 1,
        }),
      )) as DynamoDBResult;

      const transactItems: any[] = [
        {
          Delete: {
            TableName: this.tableName,
            Key: { id: variantId },
          },
        },
      ];

      if (inventoryRes.Items && inventoryRes.Items.length > 0) {
        transactItems.push({
          Delete: {
            TableName: this.inventoryTableName,
            Key: { id: inventoryRes.Items[0].id || inventoryRes.Items[0].Id },
          },
        });
      }

      await this.executeTransactionWithRetry(transactItems);
      return true;
    } catch (error) {
      console.error("[ProductVariantRepository] Error deleting variant with inventory:", error);
      return false;
    }
  }
}