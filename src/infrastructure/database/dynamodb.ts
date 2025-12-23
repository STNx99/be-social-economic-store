import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});


export const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});


export const DYNAMODB_TABLES = {
  CART_ITEM: process.env.DYNAMODB_TABLE_CART_ITEM,
  CATEGORY: process.env.DYNAMODB_TABLE_CATEGORY,
  INVENTORY: process.env.DYNAMODB_TABLE_INVENTORY,
  ORDER: process.env.DYNAMODB_TABLE_ORDER,
  PRODUCT: process.env.DYNAMODB_TABLE_PRODUCT,
  PROMOTION: process.env.DYNAMODB_TABLE_PROMOTION,
  REVIEW: process.env.DYNAMODB_TABLE_REVIEW,
  USER: process.env.DYNAMODB_TABLE_USER,
} as const;