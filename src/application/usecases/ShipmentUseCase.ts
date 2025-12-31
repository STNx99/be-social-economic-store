import {
  ShipmentEntity,
  DomainValidationError,
} from "@/domain/entities/Shipment";
import { OrderEntity } from "@/domain/entities/Order";
import { IShipmentRepository } from "@/domain/repositories/IShipmentRepository";
import { IOrderRepository } from "@/domain/repositories/IOrderRepository";
import { IShipmentUseCase } from "@/domain/usecases/IShipmentUseCase";
import { StatusBuilder, ApiResponse } from "@/utils";
import {
  Shipment,
  CreateShipmentInput,
  UpdateShipmentInput,
  ShipmentStatus,
} from "@/utils/schemas/shipment";
import { OrderStatus } from "@/utils/schemas/order";

export class ShipmentUseCase implements IShipmentUseCase {
  constructor(
    private shipmentRepository: IShipmentRepository,
    private orderRepository: IOrderRepository,
  ) {}

  async createShipment(input: CreateShipmentInput): Promise<ApiResponse<Shipment>> {
    try {
      try {
        ShipmentEntity.validateCreation(input);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const shipment = new ShipmentEntity(
        crypto.randomUUID(),
        input.orderId,
        input.shippingAddress,
        "pending",
        undefined,
        input.carrier,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );

      const savedShipment = await this.shipmentRepository.save(shipment.toJSON());
      return StatusBuilder.ok(savedShipment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getShipment(id: string): Promise<ApiResponse<Shipment>> {
    try {
      const shipmentData = await this.shipmentRepository.findById(id);

      if (!shipmentData) {
        return StatusBuilder.fail("Shipment not found", [
          { field: "id", message: "No shipment exists with the provided ID" },
        ]);
      }

      return StatusBuilder.ok(shipmentData);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getShipmentsByOrder(orderId: string): Promise<ApiResponse<Shipment[]>> {
    try {
      const shipments = await this.shipmentRepository.findByOrderId(orderId);
      return StatusBuilder.ok(shipments);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateShipment(id: string, input: UpdateShipmentInput): Promise<ApiResponse<Shipment>> {
    try {
      const shipmentData = await this.shipmentRepository.findById(id);

      if (!shipmentData) {
        return StatusBuilder.fail("Shipment not found");
      }

      try {
        ShipmentEntity.validateUpdate(input);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const shipment = ShipmentEntity.fromValidatedData(shipmentData);
      const oldStatus = shipment.status;
      
      if (input.status) shipment.status = input.status;
      if (input.trackingNumber) shipment.trackingNumber = input.trackingNumber;
      if (input.carrier) shipment.carrier = input.carrier;
      if (input.estimatedDelivery) shipment.estimatedDelivery = input.estimatedDelivery;
      if (input.actualDelivery) shipment.actualDelivery = input.actualDelivery;

      const savedShipment = await this.shipmentRepository.save(shipment.toJSON());

      if (oldStatus !== shipment.status) {
        await this.updateOrderStatusFromShipment(shipment.orderId, shipment.status);
      }

      return StatusBuilder.ok(savedShipment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async updateShipmentStatus(id: string, status: ShipmentStatus): Promise<ApiResponse<Shipment>> {
    try {
      const shipmentData = await this.shipmentRepository.findById(id);

      if (!shipmentData) {
        return StatusBuilder.fail("Shipment not found");
      }

      const shipment = ShipmentEntity.fromValidatedData(shipmentData);
      shipment.status = status;

      if (status === "delivered") {
        shipment.actualDelivery = new Date().toISOString();
      }

      const savedShipment = await this.shipmentRepository.save(shipment.toJSON());
      
      await this.updateOrderStatusFromShipment(shipment.orderId, status);

      return StatusBuilder.ok(savedShipment);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listAllShipments(): Promise<ApiResponse<Shipment[]>> {
    try {
      const shipments = await this.shipmentRepository.findAll();
      return StatusBuilder.ok(shipments);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  private async updateOrderStatusFromShipment(orderId: string, shipmentStatus: ShipmentStatus): Promise<void> {
    const orderData = await this.orderRepository.findById(orderId);
    if (!orderData) return;

    const order = OrderEntity.fromValidatedData(orderData);
    let newOrderStatus: OrderStatus | undefined;

    switch (shipmentStatus) {
      case "processing":
        newOrderStatus = "processing";
        break;
      case "shipped":
      case "in_transit":
        newOrderStatus = "shipped";
        break;
      case "delivered":
        newOrderStatus = "delivered";
        break;
      case "returned":
        newOrderStatus = "refunded";
        break;
    }

    if (newOrderStatus && order.status !== newOrderStatus) {
      order.status = newOrderStatus;
      await this.orderRepository.save(order.toJSON());
    }
  }
}