import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { User, UserRole } from "@/utils";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { dynamoDBClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class UserRepository implements IUserRepository {
  private tableName: string;
  private emailIndex?: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_USER ?? "User";
    this.emailIndex = process.env.DYNAMODB_USERS_EMAIL_INDEX;

    if (!process.env.DYNAMODB_TABLE_USERS) {
      console.warn(
        '[DynamoUserRepository] DYNAMODB_TABLE_USERS not set, defaulting to "User".',
      );
    }
  }

  private itemToUser(item: Record<string, unknown>): User {
    return {
      id: item.id as string,
      email: item.email as string,
      name: item.name as string,
      password: item.password as string,
      role: (item.role as UserRole) || "customer", 
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  async findById(id: string): Promise<User | null> {
    const cmd: GetCommand = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res = (await dynamoDBClient.send(cmd)) as DynamoDBResult;
    if (!res.Item) return null;
    return this.itemToUser(res.Item);
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

      const res = (await dynamoDBClient.send(cmd)) as DynamoDBResult;
      const item = res.Items?.[0];
      return item ? this.itemToUser(item) : null;
    }

    const cmd: ScanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    });

    const res = (await dynamoDBClient.send(cmd)) as DynamoDBResult;
    const item = res.Items?.[0];
    return item ? this.itemToUser(item) : null;
  }

  async save(user: User): Promise<User> {
    const item = {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
      updatedAt:
        user.updatedAt instanceof Date
          ? user.updatedAt.toISOString()
          : new Date(user.updatedAt).toISOString(),
    };

    await dynamoDBClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return {
      ...user,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = (await dynamoDBClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    )) as DynamoDBResult;

    return !!res.Attributes;
  }

  async findAll(): Promise<User[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined = undefined;

    do {
      const cmd: ScanCommand = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...res.Items);
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items.map((it) => this.itemToUser(it));
  }
}