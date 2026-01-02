import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Product } from "@/utils";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { ProductStatus } from "@/utils/schemas/endpoints/products";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class ProductRepository implements IProductRepository {
  private tableName: string;
  private categoryIndex?: string;
  private statusIndex?: string;
  private sellerIndex?: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_PRODUCTS ?? process.env.DYNAMODB_TABLE_PRODUCT ?? "Product";
    this.categoryIndex = process.env.DYNAMODB_PRODUCTS_CATEGORY_INDEX;
    this.statusIndex = process.env.DYNAMODB_PRODUCTS_STATUS_INDEX;
    this.sellerIndex = process.env.DYNAMODB_PRODUCTS_SELLER_INDEX;

    if (!process.env.DYNAMODB_TABLE_PRODUCTS && !process.env.DYNAMODB_TABLE_PRODUCT) {
      console.warn(
        `[DynamoProductRepository] DYNAMODB_TABLE_PRODUCTS not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToProduct(item: Record<string, unknown>): Product {
    return {
      id: (item.id || item.Id) as string,
      sellerId: item.sellerId as string,
      name: item.name as string,
      description: item.description as string | undefined,
      price: item.price as number,
      stock: item.stock as number,
      images: Array.isArray(item.images) ? (item.images as string[]) : [],
      category: item.category as string | undefined,
      status: (item.status as ProductStatus) || "pending",
      variants: Array.isArray(item.variants)
        ? (item.variants as any[]).map((v) => ({
            ...v,
            createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
            updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
          }))
        : [],
      createdAt: item.createdAt ? new Date(item.createdAt as any) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as any) : new Date(),
    };
  }

  private mapItems(items?: Record<string, unknown>[]): Product[] {
    return (items ?? []).map((item) => this.itemToProduct(item));
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const cmd: GetCommand = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Item) return this.itemToProduct(res.Item);
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const cmd: GetCommand = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });

        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (res.Item) return this.itemToProduct(res.Item);
      }
    }
    return null;
  }

  async findAll(): Promise<Product[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return this.mapItems(items);
  }

  async findByCategory(category: string): Promise<Product[]> {
    if (this.categoryIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.categoryIndex,
        KeyConditionExpression: "category = :category",
        ExpressionAttributeValues: { ":category": category },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      return this.mapItems(res.Items as Record<string, unknown>[]);
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

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      return this.mapItems(res.Items as Record<string, unknown>[]);
    }

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

  async list(filters?: {
    sellerId?: string;
    category?: string;
    status?: ProductStatus;
    search?: string;
    isAdmin?: boolean;
    userId?: string;
  }): Promise<Product[]> {
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (!filters?.isAdmin) {
      if (filters?.userId) {
        filterExpressions.push(
          "(#status = :activeStatus OR sellerId = :userIdVisibility)",
        );
        expressionAttributeValues[":activeStatus"] = "active";
        expressionAttributeValues[":userIdVisibility"] = filters.userId;
        expressionAttributeNames["#status"] = "status";
      } else {
        filterExpressions.push("#status = :activeStatus");
        expressionAttributeValues[":activeStatus"] = "active";
        expressionAttributeNames["#status"] = "status";
      }
    }

    if (filters?.sellerId) {
      filterExpressions.push("sellerId = :sellerIdFilter");
      expressionAttributeValues[":sellerIdFilter"] = filters.sellerId;
    }

    if (filters?.category) {
      filterExpressions.push("#category = :category");
      expressionAttributeValues[":category"] = filters.category;
      expressionAttributeNames["#category"] = "category";
    }

    if (filters?.status) {
      filterExpressions.push("#status = :statusFilter");
      expressionAttributeValues[":statusFilter"] = filters.status;
      expressionAttributeNames["#status"] = "status";
    }

    if (filters?.search) {
      filterExpressions.push(
        "(contains(#name, :search) OR contains(#description, :search))",
      );
      expressionAttributeValues[":search"] = filters.search;
      expressionAttributeNames["#name"] = "name";
      expressionAttributeNames["#description"] = "description";
    }

    const filterExpression =
      filterExpressions.length > 0 ? filterExpressions.join(" AND ") : undefined;

    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeValues:
          Object.keys(expressionAttributeValues).length > 0
            ? expressionAttributeValues
            : undefined,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return this.mapItems(items);
  }

  async findBySellerId(
    sellerId: string,
    filters?: {
      category?: string;
      status?: ProductStatus;
      search?: string;
    },
  ): Promise<Product[]> {
    const filterExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {
      ":sellerId": sellerId,
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (filters?.category) {
      filterExpressions.push("#category = :category");
      expressionAttributeValues[":category"] = filters.category;
      expressionAttributeNames["#category"] = "category";
    }

    if (filters?.status) {
      filterExpressions.push("#status = :status");
      expressionAttributeValues[":status"] = filters.status;
      expressionAttributeNames["#status"] = "status";
    }

    if (filters?.search) {
      filterExpressions.push(
        "(contains(#name, :search) OR contains(#description, :search))",
      );
      expressionAttributeValues[":search"] = filters.search;
      expressionAttributeNames["#name"] = "name";
      expressionAttributeNames["#description"] = "description";
    }

    const filterExpression =
      filterExpressions.length > 0 ? filterExpressions.join(" AND ") : undefined;

    if (this.sellerIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.sellerIndex,
        KeyConditionExpression: "sellerId = :sellerId",
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      return this.mapItems(res.Items as Record<string, unknown>[]);
    }

    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    const scanFilterExpressions = ["sellerId = :sellerId"];
    if (filterExpression) {
      scanFilterExpressions.push(filterExpression);
    }

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: scanFilterExpressions.join(" AND "),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return this.mapItems(items);
  }

  async save(product: Product): Promise<Product> {
    try {
      const item = {
        id: product.id,
        Id: product.id,
        sellerId: product.sellerId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images || [],
        category: product.category,
        status: product.status || "pending",
        variants: (product.variants || []).map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };

      await dynamoDBDocumentClient.send(
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

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const allItems: Record<string, unknown>[] = [];

    for (const batch of batches) {
      const promises = batch.map(async (id: string) => {
        try {
          return await dynamoDBDocumentClient.send(
            new GetCommand({
              TableName: this.tableName,
              Key: { id },
            }),
          );
        } catch (error: any) {
          if (error.name === "ValidationException") {
            return await dynamoDBDocumentClient.send(
              new GetCommand({
                TableName: this.tableName,
                Key: { Id: id },
              }),
            );
          }
          throw error;
        }
      });

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