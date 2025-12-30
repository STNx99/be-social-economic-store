import { Hono } from "hono";
import { setupUserRoutes } from "./infrastructure/routes/userRoutes";
import { setupAuthRoutes } from "./infrastructure/routes/authRoutes";
import { setupProductRoutes } from "./infrastructure/routes/productRoutes";
import { setupCategoryRoutes } from "./infrastructure/routes/categoryRoutes";
import { setupCartRoutes } from "./infrastructure/routes/cartRoutes";
import { setUpWebsocketRoute } from "./infrastructure/routes/wsRoutes";
import { websocket } from "hono/bun";

const app = new Hono();

const IS_DYNAMO =
  !!process.env.DYNAMODB_TABLE_USERS || process.env.USE_DYNAMODB === "true";

if (IS_DYNAMO) {
  const failOnInit = process.env.DYNAMODB_FAIL_ON_INIT === "true";
}


setupUserRoutes(app);
setupAuthRoutes(app);
setupProductRoutes(app);
setupCategoryRoutes(app);
setupCartRoutes(app);
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
