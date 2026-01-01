import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ProductVariant } from "@/utils/schemas/productVariant";
import { IProductVariantRepository } from "../../domain/repositories/IProductVariantRepository";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class ProductVariantRepository implements IProductVariantRepository {
  private tableName: string;
  private productIdIndex: string;
  private skuIndex: string;

  constructor() {
    this.tableName =
      process.env.DYNAMODB_TABLE_PRODUCT_VARIANTS ?? "Variant";
    this.productIdIndex =
      process.env.DYNAMODB_PRODUCT_VARIANTS_PRODUCT_ID_INDEX ??
      "ProductIdIndex";
    this.skuIndex =
      process.env.DYNAMODB_PRODUCT_VARIANTS_SKU_INDEX ?? "SkuIndex";
  }

  private itemToVariant(item: Record<string, unknown>): ProductVariant {
    return {
      id: item.id as string,
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
    const cmd = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    if (!res.Item) return null;
    return this.itemToVariant(res.Item);
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
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
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const cmd = new QueryCommand({
      TableName: this.tableName,
      IndexName: this.skuIndex,
      KeyConditionExpression: "sku = :sku",
      ExpressionAttributeValues: { ":sku": sku },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    if (!res.Items || res.Items.length === 0) return null;
    return this.itemToVariant(res.Items[0] as Record<string, unknown>);
  }

  async save(variant: ProductVariant): Promise<ProductVariant> {
    try {
      const item = {
        ...variant,
        createdAt:
          variant.createdAt instanceof Date
            ? variant.createdAt.toISOString()
            : new Date(variant.createdAt).toISOString(),
        updatedAt:
          variant.updatedAt instanceof Date
            ? variant.updatedAt.toISOString()
            : new Date(variant.updatedAt).toISOString(),
      };

      await dynamoDBDocumentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...variant,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
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
    const res = (await dynamoDBDocumentClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    )) as DynamoDBResult;

    return !!res.Attributes;
  }
}