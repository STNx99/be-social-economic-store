import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION ?? "ap-southeast-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * S3 Client configuration.
 * We explicitly provide credentials to ensure the SDK uses the correct identity.
 */
export const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  } : undefined,
});

export interface PresignedUrlOptions {
  fileName: string;
  contentType: string;
  expiresIn?: number;
  folder?: string;
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresIn: number;
}

export class S3Service {
  private bucketName: string;
  private defaultExpiresIn: number;

  constructor() {
    this.bucketName = BUCKET_NAME || "";
    this.defaultExpiresIn = 3600; // 1 hour
  }

  private validateBucketName(): void {
    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }
  }

  /**
   * Generates a presigned URL for uploading a file to S3.
   * 
   * Note: We restrict signableHeaders to avoid SignatureDoesNotMatch errors caused by
   * automatic SDK headers (like checksums) that browsers might not send.
   */
  async generatePresignedUrl(
    options: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    this.validateBucketName();

    const { fileName, contentType, expiresIn, folder } = options;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new Error(
        `Invalid content type: ${contentType}. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const fileExtension = sanitizedFileName.split(".").pop() || "jpg";
    
    const key = folder
      ? `${folder}/${timestamp}-${uuid}.${fileExtension}`
      : `products/${timestamp}-${uuid}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn || this.defaultExpiresIn,
      signableHeaders: new Set(["host", "content-type"]),
    });

    return {
      url,
      key,
      expiresIn: expiresIn || this.defaultExpiresIn,
    };
  }

  async generateMultiplePresignedUrls(
    files: Array<{ fileName: string; contentType: string }>,
    folder?: string,
  ): Promise<PresignedUrlResult[]> {
    const promises = files.map((file) =>
      this.generatePresignedUrl({
        ...file,
        folder,
      }),
    );

    return Promise.all(promises);
  }

  /**
   * Performs a direct upload from the server to S3.
   */
  async uploadFile(
    file: Buffer | Uint8Array | Blob | string,
    fileName: string,
    contentType: string,
    folder?: string,
  ): Promise<{ url: string; key: string }> {
    this.validateBucketName();

    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const fileExtension = sanitizedFileName.split(".").pop() || "jpg";
    const key = folder
      ? `${folder}/${timestamp}-${uuid}.${fileExtension}`
      : `uploads/${timestamp}-${uuid}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return {
      url: this.getPublicUrl(key),
      key,
    };
  }

  /**
   * Returns the public URL for a given S3 key.
   */
  /**
   * Deletes a file from S3.
   */
  async deleteFile(key: string): Promise<void> {
    this.validateBucketName();

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${REGION}.amazonaws.com/${key}`;
  }
}