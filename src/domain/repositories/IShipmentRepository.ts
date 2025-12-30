import { Shipment, ShipmentStatus } from "@/utils/schemas/shipment";

export interface IShipmentRepository {
  findById(id: string): Promise<Shipment | null>;
  findByOrderId(orderId: string): Promise<Shipment[]>;
  findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
  findByStatus(status: ShipmentStatus): Promise<Shipment[]>;
  save(shipment: Shipment): Promise<Shipment>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Shipment[]>;
}