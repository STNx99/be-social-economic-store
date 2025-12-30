import { Payment, PaymentTransactionStatus } from "@/utils/schemas/payment";
import { IPaymentRepository } from "@/domain/repositories/IPaymentRepository";

export class MockPaymentRepository implements IPaymentRepository {
  private payments: Map<string, Payment> = new Map();

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.orderId === orderId
    );
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return (
      Array.from(this.payments.values()).find(
        (payment) => payment.transactionId === transactionId
      ) || null
    );
  }

  async findByStatus(status: PaymentTransactionStatus): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.status === status
    );
  }

  async save(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async delete(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }

  async findAll(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }
}