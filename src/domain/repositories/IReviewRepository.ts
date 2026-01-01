import { ReviewEntity } from "../entities/Review";

export interface IReviewRepository {
  create(review: ReviewEntity): Promise<ReviewEntity>;
  findById(id: string): Promise<ReviewEntity | null>;
  findByProductId(productId: string): Promise<ReviewEntity[]>;
  findByUserId(userId: string): Promise<ReviewEntity[]>;
  findByOrderId(orderId: string): Promise<ReviewEntity[]>;
  findAll(): Promise<ReviewEntity[]>;
  update(review: ReviewEntity): Promise<ReviewEntity>;
  delete(id: string): Promise<void>;
}