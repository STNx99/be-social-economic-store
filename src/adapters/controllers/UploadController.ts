import { Context } from "hono";
import { IUploadUseCase } from "@/domain/usecases/IUploadUseCase";
import { GeneratePresignedUrlRequest } from "@/utils/schemas/endpoints/upload";
import { StatusBuilder } from "@/utils";

export class UploadController {
  constructor(private uploadUseCase: IUploadUseCase) {}

  async generatePresignedUrl(c: Context) {
    try {
      const body = (await c.req.json()) as GeneratePresignedUrlRequest;
      const response = await this.uploadUseCase.generatePresignedUrl(body);

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[UploadController] Error generating presigned URL:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }

  async uploadImage(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body["file"];
      const folder = body["folder"] as string | undefined;

      if (!file || !(file instanceof File)) {
        return c.json(
          StatusBuilder.fail("No file uploaded or invalid file"),
          400,
        );
      }

      const response = await this.uploadUseCase.uploadImage(
        Buffer.from(await file.arrayBuffer()),
        file.name,
        file.type,
        folder,
      );

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 400);
      }
    } catch (error: unknown) {
      console.error("[UploadController] Error uploading image:", error);
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Internal Server Error",
        ),
        500,
      );
    }
  }
}