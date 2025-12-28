import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Product } from "@/utils";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { dynamoDBClient } from "@/infrastructure/database";
import { ProductStatus } from "@/utils/schemas/endpoints/products";
import { DynamoDBResult } from "@/infrastructure/dynamodb/types";

export class ProductRepository implements IProductRepository {
  private tableName: string;
  private categoryIndex?: string;
  private statusIndex?: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_PRODUCTS ?? "Product";
    this.categoryIndex = process.env.DYNAMODB_PRODUCTS_CATEGORY_INDEX;
    this.statusIndex = process.env.DYNAMODB_PRODUCTS_STATUS_INDEX;

    if (!process.env.DYNAMODB_TABLE_PRODUCTS) {
      console.warn(
        '[DynamoProductRepository] DYNAMODB_TABLE_PRODUCTS not set, defaulting to "Product".',
      );
    }
  }

  private itemToProduct(item: Record<string, unknown>): Product {
    return {
      id: item.id as string,
      name: item.name as string,
      description: item.description as string | undefined,
      price: item.price as number,
      stock: item.stock as number,
      images: Array.isArray(item.images) ? (item.images as string[]) : [],
      category: item.category as string,
      status: (item.status as ProductStatus) || "active",
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  async findById(id: string): Promise<Product | null> {
    const cmd: GetCommand = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res: any = await dynamoDBClient.send(cmd);
    if (!res.Item) return null;
    return this.itemToProduct(res.Item);
  }

  async findAll(): Promise<Product[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res: any = await dynamoDBClient.send(cmd);
      if (res.Items) {
        items.push(...res.Items);
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items.map((it) => this.itemToProduct(it));
  }

  async findByCategory(category: string): Promise<Product[]> {
    if (this.categoryIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.categoryIndex,
        KeyConditionExpression: "category = :category",
        ExpressionAttributeValues: { ":category": category },
      });

      const res: any = await dynamoDBClient.send(cmd);
      return (res.Items || []).map((item: Record<string, any>) =>
        this.itemToProduct(item),
      );
    }

    const allProducts = await this.findAll();
    return allProducts.filter((p) => p.category === category);
  }

  async findByStatus(status: ProductStatus): Promise<Product[]> {
    if (this.statusIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.statusIndex,
        KeyConditionExpression: "status = :status",
        ExpressionAttributeValues: { ":status": status },
      });

      const res: any = await dynamoDBClient.send(cmd);
      return (res.Items || []).map((item: Record<string, any>) =>
        this.itemToProduct(item),
      );
    }

    // Fallback to scan if no index
    const allProducts = await this.findAll();
    return allProducts.filter((p) => p.status === status);
  }

  async searchByName(searchTerm: string): Promise<Product[]> {
    const allProducts = await this.findAll();
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        p.description?.toLowerCase().includes(lowerSearchTerm),
    );
  }

  async save(product: Product): Promise<Product> {
    try {
      const item = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images || [],
        category: product.category,
        status: product.status || "active",
        createdAt:
          product.createdAt instanceof Date
            ? product.createdAt.toISOString()
            : new Date(product.createdAt).toISOString(),
        updatedAt:
          product.updatedAt instanceof Date
            ? product.updatedAt.toISOString()
            : new Date(product.updatedAt).toISOString(),
      };

      await dynamoDBClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...product,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    } catch (error: unknown) {
      const awsError = error as { name?: string; code?: string; message?: string };
      // Check if it's a DynamoDB table not found error
      if (
        awsError?.name === "ResourceNotFoundException" ||
        awsError?.code === "ResourceNotFoundException" ||
        awsError?.message?.includes("Cannot do operations on a non-existent table")
      ) {
        throw new Error(
          `DynamoDB table "${this.tableName}" does not exist. Please create the table first.`,
        );
      }

      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const res: any = await dynamoDBClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    ) as DynamoDBResult;

    return !!res.Attributes;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    // DynamoDB BatchGetItem has a limit of 100 items
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const allItems: Record<string, unknown>[] = [];

    for (const batch of batches) {
      // Use GetCommand for each ID since BatchGetCommand is not available in lib-dynamodb
      const promises = batch.map((id: string) => 
        dynamoDBClient.send(new GetCommand({
          TableName: this.tableName,
          Key: { id },
        }))
      );

      const results = await Promise.all(promises);
      results.forEach((res) => {
        const typedRes = res as DynamoDBResult;
        if (typedRes.Item) {
          allItems.push(typedRes.Item);
        }
      });
    }

    return allItems.map((it) => this.itemToProduct(it));
  }
}