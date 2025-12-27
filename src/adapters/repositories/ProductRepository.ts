import { ddbDocClient } from "@/infrastructure/dynamodb/dynamoClient";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Product } from "@/utils";
import { IProductRepository } from "../../domain/repositories/IProductRepository";

export class ProductRepository implements IProductRepository {
  private tableName: string;
  private categoryIndex?: string;
  private statusIndex?: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_PRODUCTS ?? "Products";
    this.categoryIndex = process.env.DYNAMODB_PRODUCTS_CATEGORY_INDEX;
    this.statusIndex = process.env.DYNAMODB_PRODUCTS_STATUS_INDEX;

    if (!process.env.DYNAMODB_TABLE_PRODUCTS) {
      console.warn(
        '[DynamoProductRepository] DYNAMODB_TABLE_PRODUCTS not set, defaulting to "Products".',
      );
    }
  }

  private itemToProduct(item: Record<string, any>): Product {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      images: Array.isArray(item.images) ? item.images : [],
      category: item.category,
      status: item.status || 'active',
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };
  }

  async findById(id: string): Promise<Product | null> {
    const cmd: GetCommand = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res: any = await ddbDocClient.send(cmd);
    if (!res.Item) return null;
    return this.itemToProduct(res.Item as Record<string, any>);
  }

  async findAll(): Promise<Product[]> {
    const items: Record<string, any>[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined = undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res: any = await ddbDocClient.send(cmd);
      if (res.Items) {
        items.push(...(res.Items as Record<string, any>[]));
      }
      ExclusiveStartKey = (res as any).LastEvaluatedKey;
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

      const res: any = await ddbDocClient.send(cmd);
      return (res.Items || []).map((item: Record<string, any>) =>
        this.itemToProduct(item),
      );
    }

    // Fallback to scan if no index
    const allProducts = await this.findAll();
    return allProducts.filter((p) => p.category === category);
  }

  async findByStatus(
    status: "active" | "inactive" | "out_of_stock",
  ): Promise<Product[]> {
    if (this.statusIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.statusIndex,
        KeyConditionExpression: "status = :status",
        ExpressionAttributeValues: { ":status": status },
      });

      const res: any = await ddbDocClient.send(cmd);
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
    const item = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images || [],
      category: product.category,
      status: product.status || 'active',
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.toISOString()
          : new Date(product.createdAt).toISOString(),
      updatedAt:
        product.updatedAt instanceof Date
          ? product.updatedAt.toISOString()
          : new Date(product.updatedAt).toISOString(),
    };

    await ddbDocClient.send(
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
  }

  async delete(id: string): Promise<boolean> {
    const res: any = await ddbDocClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    );

    return !!res.Attributes;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    // DynamoDB BatchGetItem has a limit of 100 items
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const allItems: Record<string, any>[] = [];

    for (const batch of batches) {
      const keys = batch.map((id) => ({ id }));
      const cmd = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys,
          },
        },
      });

      const res: any = await ddbDocClient.send(cmd);
      if (res.Responses && res.Responses[this.tableName]) {
        allItems.push(...(res.Responses[this.tableName] as Record<string, any>[]));
      }
    }

    return allItems.map((it) => this.itemToProduct(it));
  }
}






