import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { IReviewRepository } from "../../domain/repositories/IReviewRepository";
import { ReviewEntity } from "../../domain/entities/Review";
import { dynamoDBDocumentClient, DYNAMODB_TABLES } from "@/infrastructure/database";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { Review } from "@/utils/schemas/review";
import { BaseRepository } from "./BaseRepository";

export class ReviewRepository extends BaseRepository implements IReviewRepository {
  private tableName: string;
  private productIdIndex?: string;

  constructor() {
    super();
    this.tableName = DYNAMODB_TABLES.REVIEW || "Review";

    if (!DYNAMODB_TABLES.REVIEW) {
      console.warn(
        `[ReviewRepository] DYNAMODB_TABLE_REVIEW not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToEntity(item: Record<string, unknown>): ReviewEntity {
    const data: Review = {
      id: item.id as string,
      productId: item.productId as string,
      userId: item.userId as string,
      userName: item.userName as string,
      orderId: item.orderId as string,
      rating: item.rating as number,
      comment: item.comment as string,
      images: Array.isArray(item.images) ? (item.images as string[]) : [],
      verifiedPurchase: item.verifiedPurchase as boolean,
      helpfulCount: item.helpfulCount as number,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
    return ReviewEntity.fromValidatedData(data);
  }

  async create(review: ReviewEntity): Promise<ReviewEntity> {
    const item = this.prepareItem(review.toJSON());

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return review;
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const res = (await dynamoDBDocumentClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    )) as DynamoDBResult;

    if (!res.Item) return null;
    return this.itemToEntity(res.Item);
  }

  async findByProductId(productId: string): Promise<ReviewEntity[]> {
    if (this.productIdIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.productIdIndex,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      return (res.Items ?? []).map((item) =>
        this.itemToEntity(item as Record<string, unknown>),
      );
    }

    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: "productId = :productId",
        ExpressionAttributeValues: { ":productId": productId },
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items.map((item) => this.itemToEntity(item));
  }

  async findByUserId(userId: string): Promise<ReviewEntity[]> {
    const cmd: QueryCommand = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return (res.Items ?? []).map((item) =>
      this.itemToEntity(item as Record<string, unknown>),
    );
  }

  async findByOrderId(orderId: string): Promise<ReviewEntity[]> {
    const cmd: QueryCommand = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return (res.Items ?? []).map((item) =>
      this.itemToEntity(item as Record<string, unknown>),
    );
  }

  async findAll(): Promise<ReviewEntity[]> {
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

    return items.map((item) => this.itemToEntity(item));
  }

  async update(review: ReviewEntity): Promise<ReviewEntity> {
    const item = this.prepareItem(review.toJSON());

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return review;
  }

  async delete(id: string): Promise<void> {
    await dynamoDBDocumentClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
  }
}