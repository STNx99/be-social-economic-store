import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Category } from "@/utils/schemas/category";
import { ICategoryRepository } from "@/domain/repositories/ICategoryRepository";
import { dynamoDBDocumentClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class CategoryRepository extends BaseRepository implements ICategoryRepository {
  private tableName: string;
  private slugIndex?: string;

  constructor() {
    super();
    this.tableName = process.env.DYNAMODB_TABLE_CATEGORIES ?? process.env.DYNAMODB_TABLE_CATEGORY ?? "Category";
    this.slugIndex = process.env.DYNAMODB_CATEGORIES_SLUG_INDEX;

    if (!process.env.DYNAMODB_TABLE_CATEGORIES && !process.env.DYNAMODB_TABLE_CATEGORY) {
      console.warn(
        `[DynamoCategoryRepository] DYNAMODB_TABLE_CATEGORIES not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToCategory(item: Record<string, unknown>): Category {
    return {
      id: (item.id || item.Id) as string,
      name: item.name as string,
      description: item.description as string | undefined,
      slug: item.slug as string,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const cmd: GetCommand = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Item) return this.itemToCategory(res.Item);
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const cmd: GetCommand = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });

        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (res.Item) return this.itemToCategory(res.Item);
      }
    }
    return null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    if (this.slugIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.slugIndex,
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": slug },
        Limit: 1,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      const item = res.Items?.[0];
      return item ? this.itemToCategory(item) : null;
    }

    const cmd: ScanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    const item = res.Items?.[0];
    return item ? this.itemToCategory(item) : null;
  }

  async findAll(): Promise<Category[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined = undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...res.Items);
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items.map((it) => this.itemToCategory(it));
  }

  async save(category: Category): Promise<Category> {
    const item = this.prepareItem(category);

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return {
      ...category,
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
    };
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
}

