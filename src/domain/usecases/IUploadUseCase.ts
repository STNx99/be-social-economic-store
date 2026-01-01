import {
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
  UploadImageResponse,
} from "@/utils/schemas/endpoints/upload";

export interface IUploadUseCase {
  generatePresignedUrl(
    request: GeneratePresignedUrlRequest,
  ): Promise<GeneratePresignedUrlResponse>;

  uploadImage(
    file: Buffer | Uint8Array | Blob | string,
    fileName: string,
    contentType: string,
    folder?: string,
  ): Promise<UploadImageResponse>;
}