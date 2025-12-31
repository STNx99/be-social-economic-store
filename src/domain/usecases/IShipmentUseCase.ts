import { 
  Shipment, 
  CreateShipmentInput, 
  UpdateShipmentInput,
  ShipmentStatus
} from "@/utils/schemas/shipment";
import { ApiResponse } from "@/utils";

export interface IShipmentUseCase {
  createShipment(input: CreateShipmentInput): Promise<ApiResponse<Shipment>>;
  getShipment(id: string): Promise<ApiResponse<Shipment>>;
  getShipmentsByOrder(orderId: string): Promise<ApiResponse<Shipment[]>>;
  updateShipment(id: string, input: UpdateShipmentInput): Promise<ApiResponse<Shipment>>;
  updateShipmentStatus(id: string, status: ShipmentStatus): Promise<ApiResponse<Shipment>>;
  listAllShipments(): Promise<ApiResponse<Shipment[]>>;
}