import { Shipment, ShipmentStatus } from "@/utils/schemas/shipment";
import { IShipmentRepository } from "@/domain/repositories/IShipmentRepository";

export class MockShipmentRepository implements IShipmentRepository {
  private shipments: Map<string, Shipment> = new Map();

  async findById(id: string): Promise<Shipment | null> {
    return this.shipments.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<Shipment[]> {
    return Array.from(this.shipments.values()).filter(
      (shipment) => shipment.orderId === orderId
    );
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    return (
      Array.from(this.shipments.values()).find(
        (shipment) => shipment.trackingNumber === trackingNumber
      ) || null
    );
  }

  async findByStatus(status: ShipmentStatus): Promise<Shipment[]> {
    return Array.from(this.shipments.values()).filter(
      (shipment) => shipment.status === status
    );
  }

  async save(shipment: Shipment): Promise<Shipment> {
    this.shipments.set(shipment.id, shipment);
    return shipment;
  }

  async delete(id: string): Promise<boolean> {
    return this.shipments.delete(id);
  }

  async findAll(): Promise<Shipment[]> {
    return Array.from(this.shipments.values());
  }
}