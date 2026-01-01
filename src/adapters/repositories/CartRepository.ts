import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Cart } from "@/utils/schemas/cart";
import { ICartRepository } from "@/domain/repositories/ICartRepository";
import { dynamoDBDocumentClient, DynamoDBResult } from "@/infrastructure/database/dynamodb";

export class CartRepository implements ICartRepository {
  private cartTableName: string;
  private productTableName: string;
  private inventoryTableName: string;
  private userIdIndex?: string;

  constructor() {
    this.cartTableName = process.env.DYNAMODB_TABLE_CARTS ?? process.env.DYNAMODB_TABLE_CART ?? "Cart";
    this.productTableName = process.env.DYNAMODB_TABLE_PRODUCTS ?? process.env.DYNAMODB_TABLE_PRODUCT ?? "Product";
    this.inventoryTableName = process.env.DYNAMODB_TABLE_INVENTORY ?? "Inventory";
    this.userIdIndex = process.env.DYNAMODB_CART_USER_ID_INDEX;

    if (!process.env.DYNAMODB_TABLE_CARTS && !process.env.DYNAMODB_TABLE_CART) {
      console.warn(
        `[DynamoCartRepository] DYNAMODB_TABLE_CARTS not set, defaulting to "${this.cartTableName}".`,
      );
    }
  }

  private itemToCart(item: Record<string, unknown>): Cart {
    return {
      id: item.id as string,
      userId: item.userId as string,
      items: Array.isArray(item.items) ? (item.items as Cart["items"]) : [],
      total: (item.total as number) || 0,
      createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
    };
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    if (this.userIdIndex) {
      const cmd: QueryCommand = new QueryCommand({
        TableName: this.cartTableName,
        IndexName: this.userIdIndex,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        Limit: 1,
      });

      const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
      const item = res.Items?.[0];
      return item ? this.itemToCart(item) : null;
    }

    const scanCmd = new ScanCommand({
      TableName: this.cartTableName,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    });

    const scanRes = (await dynamoDBDocumentClient.send(scanCmd)) as DynamoDBResult;
    const scanItem = scanRes.Items?.[0];
    return scanItem ? this.itemToCart(scanItem) : null;
  }

  async findById(id: string): Promise<Cart | null> {
    const cmd: GetCommand = new GetCommand({
      TableName: this.cartTableName,
      Key: { id },
    });

    const res = (await dynamoDBDocumentClient.send(cmd)) as DynamoDBResult;
    if (!res.Item) return null;
    return this.itemToCart(res.Item);
  }

  async save(cart: Cart): Promise<Cart> {
    const item = {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      total: cart.total,
      createdAt:
        cart.createdAt instanceof Date
          ? cart.createdAt.toISOString()
          : new Date(cart.createdAt).toISOString(),
      updatedAt:
        cart.updatedAt instanceof Date
          ? cart.updatedAt.toISOString()
          : new Date(cart.updatedAt).toISOString(),
    };

    await dynamoDBDocumentClient.send(
      new PutCommand({
        TableName: this.cartTableName,
        Item: item,
      }),
    );

    return {
      ...cart,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = (await dynamoDBDocumentClient.send(
      new DeleteCommand({
        TableName: this.cartTableName,
        Key: { id },
        ReturnValues: "ALL_OLD",
      }),
    )) as DynamoDBResult;

    return !!res.Attributes;
  }

  async updateProductStock(productId: string, quantityToDeduct: number): Promise<void> {
    const transactItems = [
      {
        Update: {
          TableName: this.productTableName,
          Key: { id: productId },
          UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
          ConditionExpression: "stock >= :quantity AND attribute_exists(id)",
          ExpressionAttributeValues: {
            ":quantity": quantityToDeduct,
            ":updatedAt": new Date().toISOString(),
          },
        },
      },
    ];

    if (this.inventoryTableName && process.env.DYNAMODB_TABLE_INVENTORY) {
      transactItems.push({
        Update: {
          TableName: this.inventoryTableName,
          Key: { id: productId },
          UpdateExpression: "SET availableQuantity = availableQuantity - :quantity, updatedAt = :updatedAt",
          ConditionExpression: "availableQuantity >= :quantity AND attribute_exists(id)",
          ExpressionAttributeValues: {
            ":quantity": quantityToDeduct,
            ":updatedAt": new Date().toISOString(),
          },
        },
      } as any);
    }

    await dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );
  }

  async addToCartWithInventoryUpdate(
    cart: Cart,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const cartItem = {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      total: cart.total,
      createdAt:
        cart.createdAt instanceof Date
          ? cart.createdAt.toISOString()
          : new Date(cart.createdAt).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const transactItems = [
      {
        Put: {
          TableName: this.cartTableName,
          Item: cartItem,
        },
      },
      {
        Update: {
          TableName: this.productTableName,
          Key: { id: productId },
          UpdateExpression: "SET stock = stock - :quantity, updatedAt = :updatedAt",
          ConditionExpression: "stock >= :quantity AND attribute_exists(id)",
          ExpressionAttributeValues: {
            ":quantity": quantity,
            ":updatedAt": new Date().toISOString(),
          },
        },
      },
    ];

    // Add inventory update if inventory table is configured
    if (this.inventoryTableName && process.env.DYNAMODB_TABLE_INVENTORY) {
      transactItems.push({
        Update: {
          TableName: this.inventoryTableName,
          Key: { id: productId },
          UpdateExpression: "SET availableQuantity = availableQuantity - :quantity, updatedAt = :updatedAt",
          ConditionExpression: "availableQuantity >= :quantity AND attribute_exists(id)",
          ExpressionAttributeValues: {
            ":quantity": quantity,
            ":updatedAt": new Date().toISOString(),
          },
        },
      } as any);
    }

    await dynamoDBDocumentClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      }),
    );

    return {
      ...cart,
      updatedAt: new Date(cartItem.updatedAt),
    };
  }
}

