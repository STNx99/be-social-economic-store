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
import { BaseRepository } from "./BaseRepository";

export class OrderRepository extends BaseRepository implements IOrderRepository {
  private tableName: string;
  private customerIndex?: string;
  private sellerIndex?: string;
  private statusIndex?: string;
  private cartTableName: string;

  constructor() {
    super()
    this.tableName = process.env.DYNAMODB_TABLE_ORDERS ?? process.env.DYNAMODB_TABLE_ORDER ?? "Order";
    this.cartTableName = process.env.DYNAMODB_TABLE_CARTS ?? process.env.DYNAMODB_TABLE_CART ?? "Cart";
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
      id: (item.id || item.Id) as string,
      customerId: item.customerId as string,
      sellerId: item.sellerId as string,
      cartId: item.cartId as string,
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
    try {
      const cmd = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = await dynamoDBDocumentClient.send(cmd);
      if (!res.Item) return null;
      return this.itemToOrder(res.Item);
    } catch (error: any) {
      if (error.name === "ValidationException") {
        const cmd = new GetCommand({
          TableName: this.tableName,
          Key: { Id: id },
        });

        const res = await dynamoDBDocumentClient.send(cmd);
        if (!res.Item) return null;
        return this.itemToOrder(res.Item);
      }
      throw error;
    }
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
      const item = this.prepareItem(order);

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

  async createOrdersAndClearCart(orders: Order[], cartId: string): Promise<Order[]> {
    const transactItems: any[] = orders.map((order) => ({
      Put: {
        TableName: this.tableName,
        Item: this.prepareItem(order),
      },
    }));

    transactItems.push({
      Update: {
        TableName: this.cartTableName,
        Key: { id: cartId },
        UpdateExpression: "SET #items = :emptyList, #total = :zero, updatedAt = :updatedAt",
        ConditionExpression: "attribute_exists(id) OR attribute_exists(Id)",
        ExpressionAttributeNames: {
          "#items": "items",
          "#total": "total",
        },
        ExpressionAttributeValues: {
          ":emptyList": [],
          ":zero": 0,
          ":updatedAt": new Date().toISOString(),
        },
      },
    });

    await this.executeTransactionWithRetry(transactItems);

    return orders;
  }
}