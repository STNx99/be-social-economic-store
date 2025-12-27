import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.warn(
    "[S3Service] S3_BUCKET_NAME not set. Presigned URL generation will fail.",
  );
}

export const s3Client = new S3Client({
  region: REGION,
});

export interface PresignedUrlOptions {
  fileName: string;
  contentType: string;
  expiresIn?: number; // in seconds, default 3600 (1 hour)
  folder?: string; // optional folder prefix
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
    this.defaultExpiresIn = 3600; // 1 hour default

    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }
  }

  /**
   * Generate a presigned URL for uploading an image to S3
   */
  async generatePresignedUrl(
    options: PresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    const { fileName, contentType, expiresIn, folder } = options;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new Error(
        `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Generate unique key with timestamp and UUID
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const fileExtension = sanitizedFileName.split(".").pop() || "jpg";
    const key = folder
      ? `${folder}/${timestamp}-${uuid}.${fileExtension}`
      : `products/${timestamp}-${uuid}.${fileExtension}`;

    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      // Optional: Add server-side encryption
      // ServerSideEncryption: 'AES256',
    });

    // Generate presigned URL
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn || this.defaultExpiresIn,
    });

    return {
      url,
      key,
      expiresIn: expiresIn || this.defaultExpiresIn,
    };
  }

  /**
   * Generate multiple presigned URLs for batch uploads
   */
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
   * Get the public URL for an S3 object (if bucket is public)
   * Otherwise, generate a presigned URL for reading
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${REGION}.amazonaws.com/${key}`;
  }
}






