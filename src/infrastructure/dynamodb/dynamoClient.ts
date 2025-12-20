
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? undefined;

export const rawClient = new DynamoDBClient({
  region: REGION,
  ...(ENDPOINT ? { endpoint: ENDPOINT } : {}),
});

export const ddbDocClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});
