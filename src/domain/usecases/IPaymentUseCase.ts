import { 
  Payment, 
  CreatePaymentInput, 
  UpdatePaymentInput 
} from "@/utils/schemas/payment";
import { ApiResponse } from "@/utils";

export interface IPaymentUseCase {
  createPayment(input: CreatePaymentInput): Promise<ApiResponse<Payment>>;
  getPayment(id: string): Promise<ApiResponse<Payment>>;
  getPaymentsByOrder(orderId: string): Promise<ApiResponse<Payment[]>>;
  updatePayment(id: string, input: UpdatePaymentInput): Promise<ApiResponse<Payment>>;
  processPayment(id: string): Promise<ApiResponse<Payment>>;
  listAllPayments(): Promise<ApiResponse<Payment[]>>;
}