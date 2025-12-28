import { Hono } from "hono";
import { setupUserRoutes } from "./infrastructure/routes/userRoutes";
import { setupAuthRoutes } from "./infrastructure/routes/authRoutes";
import { setupProductRoutes } from "./infrastructure/routes/productRoutes";
import {
  initializeDynamo,
  checkDynamoHealth,
} from "./infrastructure/dynamodb/initializer";
import { setUpWebsocketRoute } from "./infrastructure/routes/wsRoutes";
import { websocket } from "hono/bun";

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
setUpWebsocketRoute(app);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Requested resource not found",
      path: c.req.path,
      method: c.req.method,
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error("[Server Error]:", err);
  return c.json(
    {
      success: false,
      error: err.message || "Internal server error",
    },
    500,
  );
});

export default {
  fetch: app.fetch,
  port: 8080,
  websocket,
};
