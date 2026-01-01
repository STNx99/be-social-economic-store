import { IReviewUseCase } from "@/domain/usecases/IReviewUseCase";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { ReviewEntity } from "@/domain/entities/Review";
import { Review, CreateReviewInput, UpdateReviewInput, ReviewSummary } from "@/utils/schemas/review";

export class ReviewUseCase implements IReviewUseCase {
  constructor(
    private reviewRepository: IReviewRepository,
    private orderRepository: IOrderRepository,
    private userRepository: IUserRepository
  ) {}

  async createReview(productId: string, userId: string, data: CreateReviewInput): Promise<Review> {
    ReviewEntity.validateCreation(data);

    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.customerId !== userId) {
      throw new Error("Unauthorized: This order does not belong to you");
    }

    const productInOrder = order.items.find((item) => item.productId === productId);
    if (!productInOrder) {
      throw new Error("Product not found in this order");
    }

    const existingReviews = await this.reviewRepository.findByOrderId(data.orderId);
    const alreadyReviewed = existingReviews.some((r) => r.productId === productId);
    if (alreadyReviewed) {
      throw new Error("You have already reviewed this product for this order");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const review = new ReviewEntity(
      crypto.randomUUID(),
      productId,
      userId,
      user.name,
      data.orderId,
      data.rating,
      data.comment,
      data.images,
      true, // verifiedPurchase is true since we verified the order
      0
    );

    const savedReview = await this.reviewRepository.create(review);
    return savedReview.toJSON();
  }

  async getReviewById(id: string): Promise<Review | null> {
    const review = await this.reviewRepository.findById(id);
    return review ? review.toJSON() : null;
  }

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    return reviews.map((r) => r.toJSON());
  }

  async getReviewsByUserId(userId: string): Promise<Review[]> {
    const reviews = await this.reviewRepository.findByUserId(userId);
    return reviews.map((r) => r.toJSON());
  }

  async getAllReviews(): Promise<Review[]> {
    const reviews = await this.reviewRepository.findAll();
    return reviews.map((r) => r.toJSON());
  }

  async updateReview(id: string, userId: string, data: UpdateReviewInput): Promise<Review> {
    const existingReview = await this.reviewRepository.findById(id);
    if (!existingReview) {
      throw new Error("Review not found");
    }

    if (existingReview.userId !== userId) {
      throw new Error("Unauthorized to update this review");
    }

    ReviewEntity.validateUpdate(data);

    if (data.rating !== undefined) {
      existingReview.rating = data.rating;
    }
    if (data.comment !== undefined) {
      existingReview.comment = data.comment;
    }

    const updatedReview = await this.reviewRepository.update(existingReview);
    return updatedReview.toJSON();
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const existingReview = await this.reviewRepository.findById(id);
    if (!existingReview) {
      throw new Error("Review not found");
    }

    if (existingReview.userId !== userId) {
      throw new Error("Unauthorized to delete this review");
    }

    await this.reviewRepository.delete(id);
  }

  async getReviewSummary(productId: string): Promise<ReviewSummary> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    const totalReviews = reviews.length;
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = review.rating as 1 | 2 | 3 | 4 | 5;
      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }
      totalRating += review.rating;
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
      ratingDistribution: distribution,
    };
  }
}