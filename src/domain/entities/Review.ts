import {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  CreateReviewSchema,
  UpdateReviewSchema,
} from "@/utils/schemas/review";
import { DomainValidationError } from "./Product";

export class ReviewEntity implements Review {
  private idValue: string;
  private productIdValue: string;
  private userIdValue: string;
  private userNameValue: string;
  private orderIdValue: string;
  private ratingValue: number;
  private commentValue: string;
  private imagesValue: string[];
  private verifiedPurchaseValue: boolean;
  private helpfulCountValue: number;
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    productId: string,
    userId: string,
    userName: string,
    orderId: string,
    rating: number,
    comment: string,
    images: string[] = [],
    verifiedPurchase: boolean = false,
    helpfulCount: number = 0,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.productIdValue = productId;
    this.userIdValue = userId;
    this.userNameValue = userName;
    this.orderIdValue = orderId;
    this.ratingValue = rating;
    this.commentValue = comment;
    this.imagesValue = images;
    this.verifiedPurchaseValue = verifiedPurchase;
    this.helpfulCountValue = helpfulCount;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get productId(): string {
    return this.productIdValue;
  }

  get userId(): string {
    return this.userIdValue;
  }

  get userName(): string {
    return this.userNameValue;
  }

  get orderId(): string {
    return this.orderIdValue;
  }

  get rating(): number {
    return this.ratingValue;
  }

  get comment(): string {
    return this.commentValue;
  }

  get images(): string[] {
    return this.imagesValue;
  }

  get verifiedPurchase(): boolean {
    return this.verifiedPurchaseValue;
  }

  get helpfulCount(): number {
    return this.helpfulCountValue;
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  set rating(value: number) {
    this.ratingValue = value;
    this.updatedAtValue = new Date();
  }

  set comment(value: string) {
    this.commentValue = value;
    this.updatedAtValue = new Date();
  }

  set images(value: string[]) {
    this.imagesValue = value;
    this.updatedAtValue = new Date();
  }

  incrementHelpfulCount(): void {
    this.helpfulCountValue += 1;
    this.updatedAtValue = new Date();
  }

  toJSON(): Review {
    return {
      id: this.id,
      productId: this.productId,
      userId: this.userId,
      userName: this.userName,
      orderId: this.orderId,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      verifiedPurchase: this.verifiedPurchase,
      helpfulCount: this.helpfulCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromValidatedData(data: Review): ReviewEntity {
    return new ReviewEntity(
      data.id,
      data.productId,
      data.userId,
      data.userName,
      data.orderId,
      data.rating,
      data.comment,
      data.images,
      data.verifiedPurchase,
      data.helpfulCount,
      data.createdAt,
      data.updatedAt,
    );
  }

  static validateCreation(data: CreateReviewInput): void {
    const result = CreateReviewSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid review creation data",
        result.error.issues.map((err) => ({
          field:
            Array.isArray(err.path) && err.path.length > 0
              ? err.path.join(".")
              : "value",
          message: err.message,
        })),
      );
    }
  }

  static validateUpdate(data: UpdateReviewInput): void {
    const result = UpdateReviewSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid review update data",
        result.error.issues.map((err) => ({
          field:
            Array.isArray(err.path) && err.path.length > 0
              ? err.path.join(".")
              : "value",
          message: err.message,
        })),
      );
    }
  }
}