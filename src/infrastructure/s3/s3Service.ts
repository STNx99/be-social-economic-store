import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export const s3Client = new S3Client({
  region: REGION,
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
    this.defaultExpiresIn = 3600; // 1 tiếng
  }

  private validateBucketName(): void {
    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }
  }

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
        `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
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
      // còn thiếu
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn || this.defaultExpiresIn,
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

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${REGION}.amazonaws.com/${key}`;
  }
}