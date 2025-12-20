declare module "@aws-sdk/client-dynamodb" {
  // Minimal shape used by the project
  export class DynamoDBClient {
    constructor(config?: any);
    send(command: any): Promise<any>;
  }

  export type DynamoDBClientConfig = any;

  // Admin/management commands used by the initializer
  export class DescribeTableCommand {
    constructor(input?: any);
  }

  export class CreateTableCommand {
    constructor(input?: any);
  }

  // Optional convenience command sometimes used for quick checks
  export class ListTablesCommand {
    constructor(input?: any);
  }
}

declare module "@aws-sdk/lib-dynamodb" {
  export class DynamoDBDocumentClient {
    static from(client: any, opts?: any): any;
  }

  export class GetCommand {
    constructor(input?: any);
  }

  export class PutCommand {
    constructor(input?: any);
  }

  export class DeleteCommand {
    constructor(input?: any);
  }

  export class QueryCommand {
    constructor(input?: any);
  }

  export class ScanCommand {
    constructor(input?: any);
  }

  export const marshallOptions: any;
  export const unmarshallOptions: any;
}
