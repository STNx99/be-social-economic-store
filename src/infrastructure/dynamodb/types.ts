/**
 * Shared types for DynamoDB operations to avoid using 'any' in repositories.
 * These interfaces match the expected structure of responses from @aws-sdk/lib-dynamodb.
 */

export type DynamoDBItem = Record<string, unknown>;

export interface DynamoDBResult {
  /**
   * Single item returned by GetCommand or PutCommand (if ReturnValues is set)
   */
  Item?: DynamoDBItem;

  /**
   * Array of items returned by QueryCommand or ScanCommand
   */
  Items?: DynamoDBItem[];

  /**
   * Pagination key returned by QueryCommand or ScanCommand
   */
  LastEvaluatedKey?: Record<string, unknown>;

  /**
   * Attributes returned by DeleteCommand or UpdateCommand when ReturnValues is set
   */
  Attributes?: DynamoDBItem;
}