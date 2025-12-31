import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Order, OrderStatus, OrderItem, PaymentStatus } from "@/utils/schemas/order";
import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { dynamoDBDocumentClient } from "@/infrastructure/database";
import { DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class OrderRepository implements IOrderRepository {
  private tableName: string;
  private customerIndex?: string;
  private sellerIndex?: string;
  private statusIndex?: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_TABLE_ORDERS ?? process.env.DYNAMODB_TABLE_ORDER ?? "Order";
    this.customerIndex = process.env.DYNAMODB_ORDERS_CUSTOMER_INDEX;
    this.sellerIndex = process.env.DYNAMODB_ORDERS_SELLER_INDEX;
    this.statusIndex = process.env.DYNAMODB_ORDERS_STATUS_INDEX;

    if (!process.env.DYNAMODB_TABLE_ORDERS && !process.env.DYNAMODB_TABLE_ORDER) {
      console.warn(
        `[OrderRepository] DYNAMODB_TABLE_ORDERS not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToOrder(item: Record<string, unknown>): Order {
    return {
      id: item.id as string,
      customerId: item.customerId as string,
      sellerId: item.sellerId as string,
      items: item.items as OrderItem[],
      totalAmount: item.totalAmount as number,
      status: item.status as OrderStatus,
      paymentStatus: item.paymentStatus as PaymentStatus,
      shippingAddress: item.shippingAddress as string,
      notes: item.notes as string | undefined,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  private mapItems(items?: Record<string, unknown>[]): Order[] {
    return (items ?? []).map((item) => this.itemToOrder(item));
  }

  async findById(id: string): Promise<Order | null> {
    const cmd = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const res = await dynamoDBDocumentClient.send(cmd);
    if (!res.Item) return null;
    return this.itemToOrder(res.Item);
  }

  async findAll(): Promise<Order[]> {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const cmd = new ScanCommand({
        TableName: this.tableName,
        ExclusiveStartKey,
      });

      const res = await dynamoDBDocumentClient.send(cmd);
      if (res.Items) {
        items.push(...(res.Items as Record<string, unknown>[]));
      }
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return this.mapItems(items);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    if (this.customerIndex) {
      const cmd = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.customerIndex,
        KeyConditionExpression: "customerId = :customerId",
        ExpressionAttributeValues: { ":customerId": customerId },
      });

      const res = await dynamoDBDocumentClient.send(cmd);
      return this.mapItems(res.Items as Record<string, unknown>[]);
    }

    const allOrders = await this.findAll();
    return allOrders.filter((o) => o.customerId === customerId);
  }

  async findBySellerId(sellerId: string): Promise<Order[]> {
    if (this.sellerIndex) {
      const cmd = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.sellerIndex,
        KeyConditionExpression: "sellerId = :sellerId",
        ExpressionAttributeValues: { ":sellerId": sellerId },
      });

      const res = await dynamoDBDocumentClient.send(cmd);
      return this.mapItems(res.Items as Record<string, unknown>[]);
    }

    const allOrders = await this.findAll();
    return allOrders.filter((o) => o.sellerId === sellerId);
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    if (this.statusIndex) {
      const cmd = new QueryCommand({
        TableName: this.tableName,
        IndexName: this.statusIndex,
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      });

      const res = await dynamoDBDocumentClient.send(cmd);
      return this.mapItems(res.Items as Record<string, unknown>[]);
    }

    const allOrders = await this.findAll();
    return allOrders.filter((o) => o.status === status);
  }

  async save(order: Order): Promise<Order> {
    try {
      const item = {
        ...order,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : new Date(order.createdAt).toISOString(),
        updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : new Date(order.updatedAt).toISOString(),
      };

      await dynamoDBDocumentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...order,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      };
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err?.name === "ResourceNotFoundException") {
        throw new Error(`DynamoDB table "${this.tableName}" does not exist.`);
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