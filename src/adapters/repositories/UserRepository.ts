import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { User, UserRole, Cart } from "@/utils";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { dynamoDBDocumentClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository implements IUserRepository {
  private tableName: string;
  private emailIndex?: string;

  constructor() {
    super();
    this.tableName = process.env.DYNAMODB_TABLE_USERS ?? process.env.DYNAMODB_TABLE_USER ?? "User";
    this.emailIndex = process.env.DYNAMODB_USERS_EMAIL_INDEX;

    if (!process.env.DYNAMODB_TABLE_USERS && !process.env.DYNAMODB_TABLE_USER) {
      console.warn(
        `[DynamoUserRepository] DYNAMODB_TABLE_USERS not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToUser(item: Record<string, unknown>): User {
    return {
      id: (item.id || item.Id) as string,
      email: item.email as string,
      name: item.name as string,
      password: item.password as string,
      role: (item.role as UserRole) || "customer", 
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  async findById(id: string): Promise<User | null> {
    try {
      const cmd: GetCommand = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Item) return this.itemToUser(res.Item);
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const cmd: GetCommand = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });

        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (res.Item) return this.itemToUser(res.Item);
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.emailIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.emailIndex,
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit: 1,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      const item = res.Items?.[0];
      return item ? this.itemToUser(item) : null;
    }

    const cmd: ScanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    const item = res.Items?.[0];
    return item ? this.itemToUser(item) : null;
  }

  async save(user: User): Promise<User> {
    const item = this.prepareItem(user);

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return {
      ...user,
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

  async findAll(): Promise<User[]> {
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

    return items.map((it) => this.itemToUser(it));
  }

  async createUserWithCart(user: User, cart: Cart): Promise<void> {
    const userItem = this.prepareItem(user);
    const cartTableName =
      process.env.DYNAMODB_TABLE_CARTS ??
      process.env.DYNAMODB_TABLE_CART ??
      "Cart";
    const cartItem = this.prepareItem(cart);

    const transactItems = [
      {
        Put: {
          TableName: this.tableName,
          Item: userItem,
          ConditionExpression:
            "attribute_not_exists(id) AND attribute_not_exists(Id)",
        },
      },
      {
        Put: {
          TableName: cartTableName,
          Item: cartItem,
        },
      },
    ];

    await this.executeTransactionWithRetry(transactItems);
  }
}