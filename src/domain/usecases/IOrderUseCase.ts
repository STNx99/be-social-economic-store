import { OrderStatus, CreateOrderInput } from "@/utils/schemas/order";
import {
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersResponse,
  UpdateOrderStatusResponse,
  CheckoutRequest,
  CheckoutResponse,
} from "@/utils/schemas/endpoints/orders";
import { SalesReportQuery, SalesReportResponse } from "@/utils/schemas/endpoints/reports";

export interface IOrderUseCase {
  checkout(userId: string, input: CheckoutRequest): Promise<CheckoutResponse>;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResponse>;
  getOrder(id: string, userId: string, role: string): Promise<GetOrderResponse>;
  listCustomerOrders(customerId: string): Promise<ListOrdersResponse>;
  listSellerOrders(sellerId: string): Promise<ListOrdersResponse>;
  updateOrderStatus(
    id: string,
    sellerId: string,
    status: OrderStatus,
  ): Promise<UpdateOrderStatusResponse>;
  cancelOrder(id: string, userId: string): Promise<UpdateOrderStatusResponse>;
  getSalesReport(sellerId: string, query: SalesReportQuery): Promise<SalesReportResponse>;
}