import { ddbDocClient } from "@/infrastructure/dynamodb/dynamoClient";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { User } from "@/utils";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

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

  private itemToUser(item: Record<string, any>): User {
    return {
      id: item.id,
      email: item.email,
      name: item.name,
      password: item.password,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };
  }

  async findById(id: string): Promise<User | null> {
    const cmd: GetCommand = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res: any = await ddbDocClient.send(cmd);
    if (!res.Item) return null;
    return this.itemToUser(res.Item as Record<string, any>);
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

      const res: any = await ddbDocClient.send(cmd);
      const item = res.Items?.[0];
      return item ? this.itemToUser(item as Record<string, any>) : null;
    }

    const cmd: ScanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    });

    const res: any = await ddbDocClient.send(cmd);
    const item = res.Items?.[0];
    return item ? this.itemToUser(item as Record<string, any>) : null;
  }

  async save(user: User): Promise<User> {
    const item = {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
      updatedAt:
        user.updatedAt instanceof Date
          ? user.updatedAt.toISOString()
          : new Date(user.updatedAt).toISOString(),
    };

    await ddbDocClient.send(
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
    const res: any = await ddbDocClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    );

    return !!res.Attributes;
  }

  async findAll(): Promise<User[]> {
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

    return items.map((it) => this.itemToUser(it));
  }
}
