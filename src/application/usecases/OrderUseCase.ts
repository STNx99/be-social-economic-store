import {
  OrderEntity,
  DomainValidationError,
} from "@/domain/entities/Order";
import { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import { IOrderUseCase } from "@/domain/usecases/IOrderUseCase";
import { StatusBuilder } from "@/utils";
import {
  OrderStatus,
  CreateOrderInput,
} from "@/utils/schemas/order";
import {
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersResponse,
  UpdateOrderStatusResponse,
} from "@/utils/schemas/endpoints/orders";
import { SalesReportQuery, SalesReportResponse } from "@/utils/schemas/endpoints/reports";

export class OrderUseCase implements IOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
    try {
      try {
        OrderEntity.validateCreation(input);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const order = new OrderEntity(
        crypto.randomUUID(),
        input.customerId,
        input.sellerId,
        input.items,
        input.totalAmount,
        input.shippingAddress,
        "pending",
        "pending",
        input.notes,
        new Date(),
        new Date(),
      );

      const savedOrder = await this.orderRepository.save(order.toJSON());
      return StatusBuilder.ok(savedOrder);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getOrder(id: string, userId: string, role: string): Promise<GetOrderResponse> {
    try {
      const orderData = await this.orderRepository.findById(id);

      if (!orderData) {
        return StatusBuilder.fail("Order not found", [
          { field: "id", message: "No order exists with the provided ID" },
        ]);
      }

      if (
        role !== "admin" &&
        orderData.customerId !== userId &&
        orderData.sellerId !== userId
      ) {
        return StatusBuilder.fail("Forbidden: Access denied", [
          { field: "id", message: "You do not have permission to view this order" },
        ]);
      }

      return StatusBuilder.ok(orderData);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listCustomerOrders(customerId: string): Promise<ListOrdersResponse> {
    try {
      const orders = await this.orderRepository.findByCustomerId(customerId);
      return StatusBuilder.ok(orders);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listSellerOrders(sellerId: string): Promise<ListOrdersResponse> {
    try {
      const orders = await this.orderRepository.findBySellerId(sellerId);
      return StatusBuilder.ok(orders);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateOrderStatus(
    id: string,
    sellerId: string,
    status: OrderStatus,
  ): Promise<UpdateOrderStatusResponse> {
    try {
      const orderData = await this.orderRepository.findById(id);

      if (!orderData) {
        return StatusBuilder.fail("Order not found");
      }

      if (orderData.sellerId !== sellerId) {
        return StatusBuilder.fail("Forbidden: Only the seller can update order status");
      }

      const order = OrderEntity.fromValidatedData(orderData);
      order.status = status;

      const savedOrder = await this.orderRepository.save(order.toJSON());
      return StatusBuilder.ok(savedOrder);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async cancelOrder(id: string, userId: string): Promise<UpdateOrderStatusResponse> {
    try {
      const orderData = await this.orderRepository.findById(id);

      if (!orderData) {
        return StatusBuilder.fail("Order not found");
      }

      const isCustomer = orderData.customerId === userId;
      const isSeller = orderData.sellerId === userId;

      if (!isCustomer && !isSeller) {
        return StatusBuilder.fail("Forbidden: Access denied");
      }

      const order = OrderEntity.fromValidatedData(orderData);

      if (isCustomer && !order.canBeCancelled()) {
        return StatusBuilder.fail(
          "Order cannot be cancelled at this stage of fulfillment",
        );
      }

      order.status = "cancelled";
      const savedOrder = await this.orderRepository.save(order.toJSON());
      return StatusBuilder.ok(savedOrder);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getSalesReport(sellerId: string, query: SalesReportQuery): Promise<SalesReportResponse> {
    try {
      const orders = await this.orderRepository.findBySellerId(sellerId);
      
      const startDate = query.startDate ? new Date(query.startDate) : new Date(0);
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const summary = {
        totalRevenue: 0,
        totalOrders: filteredOrders.length,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
      };

      const dailyMap = new Map<string, { revenue: number; orderCount: number }>();

      filteredOrders.forEach(order => {
        if (order.status === "delivered") {
          summary.totalRevenue += order.totalAmount;
          summary.completedOrders++;
        } else if (order.status === "pending" || order.status === "confirmed" || order.status === "processing") {
          summary.pendingOrders++;
        } else if (order.status === "cancelled") {
          summary.cancelledOrders++;
        }

        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        const daily = dailyMap.get(dateStr) || { revenue: 0, orderCount: 0 };
        
        if (order.status === "delivered") {
          daily.revenue += order.totalAmount;
        }
        daily.orderCount++;
        dailyMap.set(dateStr, daily);
      });

      summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;

      const dailySales = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orderCount: data.orderCount,
      })).sort((a, b) => a.date.localeCompare(b.date));

      return StatusBuilder.ok({
        sellerId,
        summary,
        dailySales,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}