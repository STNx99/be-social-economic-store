import {
  PaymentEntity,
  DomainValidationError,
} from "@/domain/entities/Payment";
import { OrderEntity } from "@/domain/entities/Order";
import { IPaymentRepository } from "@/domain/repositories/IPaymentRepository";
import { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import { IPaymentUseCase } from "@/domain/usecases/IPaymentUseCase";
import { StatusBuilder, ApiResponse } from "@/utils";
import {
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/utils/schemas/payment";

export class PaymentUseCase implements IPaymentUseCase {
  constructor(
    private paymentRepository: IPaymentRepository,
    private orderRepository: IOrderRepository,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<ApiResponse<Payment>> {
    try {
      try {
        PaymentEntity.validateCreation(input);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const payment = new PaymentEntity(
        crypto.randomUUID(),
        input.orderId,
        input.amount,
        input.method,
        input.currency || "VND",
        "pending",
        undefined,
        undefined,
        input.notes,
        new Date(),
        new Date(),
      );

      const savedPayment = await this.paymentRepository.save(payment.toJSON());
      return StatusBuilder.ok(savedPayment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    try {
      const paymentData = await this.paymentRepository.findById(id);

      if (!paymentData) {
        return StatusBuilder.fail("Payment not found", [
          { field: "id", message: "No payment exists with the provided ID" },
        ]);
      }

      return StatusBuilder.ok(paymentData);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getPaymentsByOrder(orderId: string): Promise<ApiResponse<Payment[]>> {
    try {
      const payments = await this.paymentRepository.findByOrderId(orderId);
      return StatusBuilder.ok(payments);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updatePayment(id: string, input: UpdatePaymentInput): Promise<ApiResponse<Payment>> {
    try {
      const paymentData = await this.paymentRepository.findById(id);

      if (!paymentData) {
        return StatusBuilder.fail("Payment not found");
      }

      try {
        PaymentEntity.validateUpdate(input);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const payment = PaymentEntity.fromValidatedData(paymentData);
      const oldStatus = payment.status;
      
      if (input.status) payment.status = input.status;
      if (input.transactionId) payment.transactionId = input.transactionId;
      if (input.notes) payment.notes = input.notes;

      const savedPayment = await this.paymentRepository.save(payment.toJSON());

      if (oldStatus !== "completed" && payment.status === "completed") {
        await this.updateOrderPaymentStatus(payment.orderId);
      }

      return StatusBuilder.ok(savedPayment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async processPayment(id: string): Promise<ApiResponse<Payment>> {
    try {
      const paymentData = await this.paymentRepository.findById(id);

      if (!paymentData) {
        return StatusBuilder.fail("Payment not found");
      }

      const payment = PaymentEntity.fromValidatedData(paymentData);
      
      payment.status = "completed";
      payment.transactionId = `TXN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

      const savedPayment = await this.paymentRepository.save(payment.toJSON());

      await this.updateOrderPaymentStatus(payment.orderId);

      return StatusBuilder.ok(savedPayment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listAllPayments(): Promise<ApiResponse<Payment[]>> {
    try {
      const payments = await this.paymentRepository.findAll();
      return StatusBuilder.ok(payments);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  private async updateOrderPaymentStatus(orderId: string): Promise<void> {
    const orderData = await this.orderRepository.findById(orderId);
    if (orderData) {
      const order = OrderEntity.fromValidatedData(orderData);
      order.paymentStatus = "paid";
      
      if (order.status === "pending") {
        order.status = "confirmed";
      }
      
      await this.orderRepository.save(order.toJSON());
    }
  }
}