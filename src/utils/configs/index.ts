import { cors } from "hono/cors";
import { logger } from "hono/logger";

export const serverCors = cors({
  origin: [
    "http://localhost:3000",
    "https://besocialeconomicstore.vercel.app",
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
});

export const serverLogger = logger()