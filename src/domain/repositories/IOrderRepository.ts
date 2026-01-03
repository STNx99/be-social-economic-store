import { Order, OrderStatus } from "@/utils/schemas/order";

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  delete(id: string): Promise<boolean>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findBySellerId(sellerId: string): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  createOrdersAndClearCart(orders: Order[], cartId: string): Promise<Order[]>;
}