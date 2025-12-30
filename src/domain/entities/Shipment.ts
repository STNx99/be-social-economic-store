import {
  Shipment,
  CreateShipmentInput,
  UpdateShipmentInput,
  CreateShipmentSchema,
  UpdateShipmentSchema,
  ShipmentStatus,
} from "@/utils/schemas/shipment";

export class ShipmentEntity implements Shipment {
  private idValue: string;
  private orderIdValue: string;
  private trackingNumberValue?: string;
  private carrierValue?: string;
  private statusValue: ShipmentStatus;
  private estimatedDeliveryValue?: string;
  private actualDeliveryValue?: string;
  private shippingAddressValue: string;
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    orderId: string,
    shippingAddress: string,
    status: ShipmentStatus = "pending",
    trackingNumber?: string,
    carrier?: string,
    estimatedDelivery?: string,
    actualDelivery?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.orderIdValue = orderId;
    this.shippingAddressValue = shippingAddress;
    this.statusValue = status;
    this.trackingNumberValue = trackingNumber;
    this.carrierValue = carrier;
    this.estimatedDeliveryValue = estimatedDelivery;
    this.actualDeliveryValue = actualDelivery;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get orderId(): string {
    return this.orderIdValue;
  }

  get trackingNumber(): string | undefined {
    return this.trackingNumberValue;
  }

  get carrier(): string | undefined {
    return this.carrierValue;
  }

  get status(): ShipmentStatus {
    return this.statusValue;
  }

  get estimatedDelivery(): string | undefined {
    return this.estimatedDeliveryValue;
  }

  get actualDelivery(): string | undefined {
    return this.actualDeliveryValue;
  }

  get shippingAddress(): string {
    return this.shippingAddressValue;
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  set status(value: ShipmentStatus) {
    this.statusValue = value;
    this.updatedAtValue = new Date();
  }

  set trackingNumber(value: string | undefined) {
    this.trackingNumberValue = value;
    this.updatedAtValue = new Date();
  }

  set carrier(value: string | undefined) {
    this.carrierValue = value;
    this.updatedAtValue = new Date();
  }

  set estimatedDelivery(value: string | undefined) {
    this.estimatedDeliveryValue = value;
    this.updatedAtValue = new Date();
  }

  set actualDelivery(value: string | undefined) {
    this.actualDeliveryValue = value;
    this.updatedAtValue = new Date();
  }

  isDelivered(): boolean {
    return this.statusValue === "delivered";
  }

  toJSON(): Shipment {
    return {
      id: this.idValue,
      orderId: this.orderIdValue,
      trackingNumber: this.trackingNumberValue,
      carrier: this.carrierValue,
      status: this.statusValue,
      estimatedDelivery: this.estimatedDeliveryValue,
      actualDelivery: this.actualDeliveryValue,
      shippingAddress: this.shippingAddressValue,
      createdAt: this.createdAtValue,
      updatedAt: this.updatedAtValue,
    };
  }

  static fromObject(data: Shipment): ShipmentEntity {
    return new ShipmentEntity(
      data.id,
      data.orderId,
      data.shippingAddress,
      data.status,
      data.trackingNumber,
      data.carrier,
      data.estimatedDelivery,
      data.actualDelivery,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromValidatedData(data: Shipment): ShipmentEntity {
    return ShipmentEntity.fromObject(data);
  }

  static validateCreation(data: CreateShipmentInput): void {
    const result = CreateShipmentSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid shipment creation data",
        result.error.issues.map((err) => ({
          field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join(".") : "value",
          message: err.message,
        })),
      );
    }
  }

  static validateUpdate(data: UpdateShipmentInput): void {
    const result = UpdateShipmentSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid shipment update data",
        result.error.issues.map((err) => ({
          field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join(".") : "value",
          message: err.message,
        })),
      );
    }
  }
}

export class DomainValidationError extends Error {
  constructor(message: string, public readonly details: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "DomainValidationError";
  }
}