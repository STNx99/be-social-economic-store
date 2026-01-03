import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Shipment, ShipmentStatus } from "@/utils/schemas/shipment";
import { IShipmentRepository } from "@/domain/repositories/IShipmentRepository";
import { dynamoDBDocumentClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";
import { BaseRepository } from "./BaseRepository";

export class ShipmentRepository extends BaseRepository implements IShipmentRepository {
  private tableName: string;

  constructor() {
    super();
    this.tableName = process.env.DYNAMODB_TABLE_SHIPMENTS ?? process.env.DYNAMODB_TABLE_SHIPMENT ?? "Shipment";

    if (!process.env.DYNAMODB_TABLE_SHIPMENTS && !process.env.DYNAMODB_TABLE_SHIPMENT) {
      console.warn(
        `[ShipmentRepository] DYNAMODB_TABLE_SHIPMENTS not set, defaulting to "${this.tableName}".`,
      );
    }
  }

  private itemToShipment(item: Record<string, unknown>): Shipment {
    return {
      id: item.id as string,
      orderId: item.orderId as string,
      trackingNumber: item.trackingNumber as string | undefined,
      carrier: item.carrier as string | undefined,
      status: item.status as ShipmentStatus,
      estimatedDelivery: item.estimatedDelivery as string | undefined,
      actualDelivery: item.actualDelivery as string | undefined,
      shippingAddress: item.shippingAddress as string,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  private mapItems(items?: Record<string, unknown>[]): Shipment[] {
    return (items ?? []).map((item) => this.itemToShipment(item));
  }

  async findById(id: string): Promise<Shipment | null> {
    try {
      const cmd = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      if (!res.Item) return null;
      return this.itemToShipment(res.Item);
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
        return this.itemToShipment(res.Item);
      }
      throw error;
    }
  }

  async findByOrderId(orderId: string): Promise<Shipment[]> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return this.mapItems(res.Items as Record<string, unknown>[]);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "trackingNumber = :trackingNumber",
      ExpressionAttributeValues: { ":trackingNumber": trackingNumber },
      Limit: 1,
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    if (!res.Items || res.Items.length === 0) return null;
    return this.itemToShipment(res.Items[0] as Record<string, unknown>);
  }

  async findByStatus(status: ShipmentStatus): Promise<Shipment[]> {
    const cmd = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    return this.mapItems(res.Items as Record<string, unknown>[]);
  }

  async save(shipment: Shipment): Promise<Shipment> {
    try {
      const item = this.prepareItem(shipment);

      await dynamoDBDocumentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        }),
      );

      return {
        ...shipment,
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
      if (
        error.name === "ValidationException" ||
        error.message?.includes("The provided key element does not match the schema")
      ) {
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

  async findAll(): Promise<Shipment[]> {
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