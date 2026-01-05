import { Hono } from "hono";
import { setupUserRoutes } from "./infrastructure/routes/userRoutes";
import { setupAuthRoutes } from "./infrastructure/routes/authRoutes";
import { setupProductVariantRoutes } from "./infrastructure/routes/productVariantRoutes";
import { setupProductRoutes } from "./infrastructure/routes/productRoutes";
import { setupCategoryRoutes } from "./infrastructure/routes/categoryRoutes";
import { setupOrderRoutes } from "./infrastructure/routes/orderRoutes";
import { setupPaymentRoutes } from "./infrastructure/routes/paymentRoutes";
import { setupShipmentRoutes } from "./infrastructure/routes/shipmentRoutes";
import { setupReportRoutes } from "./infrastructure/routes/reportRoutes";
import { setupCartRoutes } from "./infrastructure/routes/cartRoutes";
import { setupUploadRoutes } from "./infrastructure/routes/uploadRoutes";
import { setUpWebsocketRoute } from "./infrastructure/routes/wsRoutes";
import { setupInventoryRoutes } from "./infrastructure/routes/inventoryRoutes";
import { setupReviewRoutes } from "./infrastructure/routes/reviewRoutes";
import { setupAIRoutes } from "./infrastructure/routes/aiRoutes";
import { websocket } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

const IS_DYNAMO =
  !!process.env.DYNAMODB_TABLE_USERS || process.env.USE_DYNAMODB === "true";

if (IS_DYNAMO) {
  const failOnInit = process.env.DYNAMODB_FAIL_ON_INIT === "true";
}
const allowOrigins = process.env.ALLOW_ORIGINS;

app.use(logger());
app.use(
  "*",
  cors({
    origin: allowOrigins || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
  }),
);

setupUserRoutes(app);
setupAuthRoutes(app);
setupProductVariantRoutes(app);
setupProductRoutes(app);
setupCategoryRoutes(app);
setupOrderRoutes(app);
setupPaymentRoutes(app);
setupShipmentRoutes(app);
setupReportRoutes(app);
setupCartRoutes(app);
setupUploadRoutes(app);
setUpWebsocketRoute(app);
setupInventoryRoutes(app);
setupReviewRoutes(app);
setupAIRoutes(app);

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