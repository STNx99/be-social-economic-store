import { IUploadUseCase } from "@/domain/usecases/IUploadUseCase";
import { S3Service } from "@/infrastructure/s3/s3Service";
import { StatusBuilder } from "@/utils";
import {
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
  UploadImageResponse,
} from "@/utils/schemas/endpoints/upload";

export class UploadUseCase implements IUploadUseCase {
  constructor(private s3Service: S3Service) {}

  async generatePresignedUrl(
    request: GeneratePresignedUrlRequest,
  ): Promise<GeneratePresignedUrlResponse> {
    try {
      const result = await this.s3Service.generatePresignedUrl({
        fileName: request.fileName,
        contentType: request.contentType,
        folder: request.folder || "general",
      });

      return StatusBuilder.ok(result);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async uploadImage(
    file: Buffer | Uint8Array | Blob | string,
    fileName: string,
    contentType: string,
    folder?: string,
  ): Promise<UploadImageResponse> {
    try {
      const result = await this.s3Service.uploadFile(
        file,
        fileName,
        contentType,
        folder,
      );

      return StatusBuilder.ok(result);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}