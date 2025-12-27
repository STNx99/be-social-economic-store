import { Hono } from "hono";
import { setupUserRoutes } from "./infrastructure/routes/userRoutes";
import { setupAuthRoutes } from "./infrastructure/routes/authRoutes";
import { setupProductRoutes } from "./infrastructure/routes/productRoutes";
import {
  initializeDynamo,
  checkDynamoHealth,
} from "./infrastructure/dynamodb/initializer";

const app = new Hono();

const IS_DYNAMO =
  !!process.env.DYNAMODB_TABLE_USERS || process.env.USE_DYNAMODB === "true";

if (IS_DYNAMO) {
  const failOnInit = process.env.DYNAMODB_FAIL_ON_INIT === "true";

  if (failOnInit) {
    await initializeDynamo();
  } else {
    initializeDynamo().catch((err) => {
      console.error(
        "[Dynamo] initialization error:",
        err instanceof Error ? err.message : err,
      );
    });
  }
}

app.get("/health", async (c) => {
  const base = { status: "ok", timestamp: new Date().toISOString() };
  if (IS_DYNAMO) {
    const dynamo = await checkDynamoHealth();
    return c.json({ ...base, dynamo });
  }
  return c.json(base);
});

setupUserRoutes(app);
setupAuthRoutes(app);
setupProductRoutes(app);

export default app;
