import {
  OrderEntity,
  DomainValidationError,
} from "@/domain/entities/Order";
import { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import { IOrderUseCase } from "@/domain/usecases/IOrderUseCase";
import { StatusBuilder } from "@/utils";
import {
  Order,
  OrderStatus,
  CreateOrderInput,
} from "@/utils/schemas/order";
import {
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersResponse,
  UpdateOrderStatusResponse,
  CheckoutRequest,
  CheckoutResponse,
} from "@/utils/schemas/endpoints/orders";
import { ICartRepository } from "@/domain/repositories/ICartRepository";
import { IProductRepository } from "@/domain/repositories/IProductRepository";
import { IProductVariantRepository } from "@/domain/repositories/IProductVariantRepository";
import { IPaymentUseCase } from "@/domain/usecases/IPaymentUseCase";
import { SalesReportQuery, SalesReportResponse } from "@/utils/schemas/endpoints/reports";

export class OrderUseCase implements IOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
    private variantRepository: IProductVariantRepository,
    private paymentUseCase: IPaymentUseCase,
  ) {}

  async checkout(userId: string, input: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const cart = await this.cartRepository.findById(input.cartId);
      if (!cart || cart.userId !== userId) {
        return StatusBuilder.fail("Cart not found", [
          { field: "cartId", message: "Cart does not exist or does not belong to user" },
        ]);
      }

      if (cart.items.length === 0) {
        return StatusBuilder.fail("Cart is empty", [
          { field: "cart", message: "No items in cart to checkout" },
        ]);
      }

      const itemsBySeller = new Map<string, any[]>();

      for (const item of cart.items) {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          return StatusBuilder.fail(`Product not found: ${item.productId}`);
        }

        const sellerId = product.sellerId;
        if (!itemsBySeller.has(sellerId)) {
          itemsBySeller.set(sellerId, []);
        }
        itemsBySeller.get(sellerId)!.push({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
      }

      const ordersToCreate: Order[] = [];
      for (const [sellerId, items] of itemsBySeller.entries()) {
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const order = new OrderEntity(
          crypto.randomUUID(),
          userId,
          sellerId,
          input.cartId,
          items,
          totalAmount,
          input.shippingAddress,
          "pending",
          "pending",
          input.notes,
          new Date(),
          new Date(),
        );
        ordersToCreate.push(order.toJSON());
      }

      const createdOrders = await this.orderRepository.createOrdersAndClearCart(
        ordersToCreate,
        cart.id,
      );

      for (const order of createdOrders) {
        await this.paymentUseCase.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          method: input.paymentMethod,
          notes: input.notes,
        });
      }

      return StatusBuilder.ok(createdOrders[0]);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

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
        input.cartId,
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