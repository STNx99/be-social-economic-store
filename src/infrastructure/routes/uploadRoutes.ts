import { Hono } from "hono";
import { Container } from "../dependencies/Container";
import { requireAuth } from "../middleware/auth";

export const setupUploadRoutes = (app: Hono) => {
  const container = Container.getInstance();
  const uploadController = container.getUploadController();

  app.post("/api/upload/presigned", requireAuth(), (c) =>
    uploadController.generatePresignedUrl(c),
  );

  app.post("/api/upload", requireAuth(), (c) =>
    uploadController.uploadImage(c),
  );
};