import { rawClient } from "@/infrastructure/dynamodb/dynamoClient";
import { DescribeTableCommand, CreateTableCommand } from "@aws-sdk/client-dynamodb";

export type InitializeOptions = {
  autoCreate?: boolean;
  failOnError?: boolean;
  timeoutSeconds?: number;
};

export type InitializeResult = {
  ok: boolean;
  configured: boolean;
  table?: string;
  created?: boolean;
  error?: string;
};

export type HealthResult = {
  enabled: boolean;
  ok: boolean;
  table?: string;
  status?: string;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function isDynamoConfigured(): boolean {
  return !!(process.env.DYNAMODB_TABLE_USERS || process.env.USE_DYNAMODB === "true");
}

async function waitForTableActive(tableName: string, timeoutSeconds = 60): Promise<void> {
  const start = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  while (Date.now() - start < timeoutMs) {
    try {
      const res: any = await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
      const status = res?.Table?.TableStatus;
      if (status === "ACTIVE") {
        return;
      }
    } catch (_err) {
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for table ${tableName} to become ACTIVE`);
}

export async function initializeDynamo(opts?: InitializeOptions): Promise<InitializeResult> {
  const configured = isDynamoConfigured();
  if (!configured) {
    return { ok: true, configured: false };
  }

  const tableName = process.env.DYNAMODB_TABLE_USERS ?? "Users";
  const autoCreate = opts?.autoCreate ?? process.env.DYNAMODB_AUTO_CREATE_TABLE === "true";
  const failOnError = opts?.failOnError ?? process.env.DYNAMODB_FAIL_ON_INIT === "true";
  const timeoutSeconds = opts?.timeoutSeconds ?? 60;
  const emailIndexName = process.env.DYNAMODB_USERS_EMAIL_INDEX;

  try {
    const describeRes: any = await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
    const status = describeRes?.Table?.TableStatus;
    if (status === "ACTIVE") {
      console.info(`[DynamoInit] Table '${tableName}' exists and is ACTIVE.`);
      return { ok: true, configured: true, table: tableName, created: false };
    }

    console.info(`[DynamoInit] Table '${tableName}' exists but status is '${status}'. Waiting for ACTIVE...`);
    await waitForTableActive(tableName, timeoutSeconds);
    console.info(`[DynamoInit] Table '${tableName}' is now ACTIVE.`);
    return { ok: true, configured: true, table: tableName, created: false };
  } catch (err: any) {
    // If table not found and auto-create is enabled, create it
    const notFound = err?.name === "ResourceNotFoundException" || (err?.$metadata && err.$metadata.httpStatusCode === 400);
    if (notFound && autoCreate) {
      console.info(`[DynamoInit] Table '${tableName}' not found. Auto-create is enabled — creating table...`);
      try {
        const attributeDefinitions: any[] = [{ AttributeName: "id", AttributeType: "S" }];
        const keySchema: any[] = [{ AttributeName: "id", KeyType: "HASH" }];
        const params: any = {
          TableName: tableName,
          AttributeDefinitions: attributeDefinitions,
          KeySchema: keySchema,
          BillingMode: "PAY_PER_REQUEST", // on-demand billing to avoid provisioning during init
        };

        if (emailIndexName) {
          // Add email attribute definition and GSI
          attributeDefinitions.push({ AttributeName: "email", AttributeType: "S" });
          params.GlobalSecondaryIndexes = [
            {
              IndexName: emailIndexName,
              KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
            },
          ];
          console.info(`[DynamoInit] Creating table '${tableName}' with GSI '${emailIndexName}'.`);
        } else {
          console.info(`[DynamoInit] Creating table '${tableName}' without a GSI.`);
        }

        await rawClient.send(new CreateTableCommand(params));
        // wait for ACTIVE
        await waitForTableActive(tableName, timeoutSeconds);
        console.info(`[DynamoInit] Table '${tableName}' created and is ACTIVE.`);
        return { ok: true, configured: true, table: tableName, created: true };
      } catch (createErr: any) {
        const msg = String(createErr?.message ?? createErr);
        console.error(`[DynamoInit] Failed to create table '${tableName}': ${msg}`);
        if (failOnError) {
          throw createErr;
        }
        return { ok: false, configured: true, table: tableName, error: msg };
      }
    }

    // Some other error occurred
    const message = String(err?.message ?? err);
    console.error(`[DynamoInit] Error checking table '${tableName}': ${message}`);
    if (failOnError) {
      throw err;
    }
    return { ok: false, configured: true, table: tableName, error: message };
  }
}

/**
 * Check DynamoDB connectivity and table status.
 * Returns an object describing whether Dynamo is enabled and whether we can reach the configured table.
 */
export async function checkDynamoHealth(): Promise<HealthResult> {
  const configured = isDynamoConfigured();
  if (!configured) {
    return { enabled: false, ok: true };
  }

  const tableName = process.env.DYNAMODB_TABLE_USERS ?? "Users";
  try {
    const res: any = await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
    const status = res?.Table?.TableStatus ?? "UNKNOWN";
    return { enabled: true, ok: status === "ACTIVE", table: tableName, status };
  } catch (err: any) {
    const message = String(err?.message ?? err);
    return { enabled: true, ok: false, table: tableName, error: message };
  }
}

if (process.env.DYNAMODB_INIT_ON_IMPORT === "true") {
  initializeDynamo().catch((err: any) => {
    const failOnError = process.env.DYNAMODB_FAIL_ON_INIT === "true";
    console.error("[DynamoInit] automatic initialization failed:", err?.message ?? err);
    if (failOnError) {
      setTimeout(() => {
        throw err;
      }, 0);
    }
  });
}
