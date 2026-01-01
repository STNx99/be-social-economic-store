import { Review, CreateReviewInput, UpdateReviewInput, ReviewSummary } from "@/utils/schemas/review";

export interface IReviewUseCase {
  createReview(productId: string, userId: string, data: CreateReviewInput): Promise<Review>;
  getReviewById(id: string): Promise<Review | null>;
  getReviewsByProductId(productId: string): Promise<Review[]>;
  getReviewsByUserId(userId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  updateReview(id: string, userId: string, data: UpdateReviewInput): Promise<Review>;
  deleteReview(id: string, userId: string): Promise<void>;
  getReviewSummary(productId: string): Promise<ReviewSummary>;
}