import { Payment, PaymentTransactionStatus } from "@/utils/schemas/payment";

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
  findByStatus(status: PaymentTransactionStatus): Promise<Payment[]>;
  save(payment: Payment): Promise<Payment>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Payment[]>;
}