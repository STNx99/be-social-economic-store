import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Payment, PaymentTransactionStatus } from "@/utils/schemas/payment";
import { IPaymentRepository } from "@/domain/repositories/IPaymentRepository";
import { dynamoDBDocumentClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class PaymentRepository extends BaseRepository implements IPaymentRepository {
  private tableName: string;

  constructor() {
    super();
    this.tableName = process.env.DYNAMODB_TABLE_PAYMENTS ?? process.env.DYNAMODB_TABLE_PAYMENT ?? "Payment";

    if (!process.env.DYNAMODB_TABLE_PAYMENTS && !process.env.DYNAMODB_TABLE_PAYMENT) {
      console.warn(
        `[PaymentRepository] DYNAMODB_TABLE_PAYMENTS not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToPayment(item: Record<string, unknown>): Payment {
    return {
      id: item.id as string,
      orderId: item.orderId as string,
      amount: item.amount as number,
      currency: (item.currency as string) || "VND",
      method: item.method as any,
      status: item.status as PaymentTransactionStatus,
      transactionId: item.transactionId as string | undefined,
      paymentGateway: item.paymentGateway as string | undefined,
      notes: item.notes as string | undefined,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  private mapItems(items?: Record<string, unknown>[]): Payment[] {
    return (items ?? []).map((item) => this.itemToPayment(item));
  }

  async findById(id: string): Promise<Payment | null> {
    try {
      const cmd = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (!res.Item) return null;
      return this.itemToPayment(res.Item);
    } catch (error: any) {
      if (
        error.name === "ValidationException" ||
        error.message?.includes("The provided key element does not match the schema")
      ) {
        const cmd = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });
        const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
        if (!res.Item) return null;
        return this.itemToPayment(res.Item);
      }
      throw error;
    }
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return this.mapItems(res.Items as Record<string, unknown>[]);
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "transactionId = :transactionId",
      ExpressionAttributeValues: { ":transactionId": transactionId },
      Limit: 1,
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    if (!res.Items || res.Items.length === 0) return null;
    return this.itemToPayment(res.Items[0] as Record<string, unknown>);
  }

  async findByStatus(status: PaymentTransactionStatus): Promise<Payment[]> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return this.mapItems(res.Items as Record<string, unknown>[]);
  }

  async save(payment: Payment): Promise<Payment> {
    try {
      const item = this.prepareItem(payment);

      await dynamoDBDocumentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...payment,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        throw new Error(`DynamoDB table "${this.tableName}" does not exist.`);
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

  async findAll(): Promise<Payment[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);

    return this.mapItems(items);
  }
}