import {
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  CreatePaymentSchema,
  UpdatePaymentSchema,
  PaymentTransactionStatus,
  PaymentMethod,
} from "@/utils/schemas/payment";

export class PaymentEntity implements Payment {
  private idValue: string;
  private orderIdValue: string;
  private amountValue: number;
  private currencyValue: string;
  private methodValue: PaymentMethod;
  private statusValue: PaymentTransactionStatus;
  private transactionIdValue?: string;
  private paymentGatewayValue?: string;
  private notesValue?: string;
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    orderId: string,
    amount: number,
    method: PaymentMethod,
    currency: string = "VND",
    status: PaymentTransactionStatus = "pending",
    transactionId?: string,
    paymentGateway?: string,
    notes?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.orderIdValue = orderId;
    this.amountValue = amount;
    this.currencyValue = currency;
    this.methodValue = method;
    this.statusValue = status;
    this.transactionIdValue = transactionId;
    this.paymentGatewayValue = paymentGateway;
    this.notesValue = notes;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get orderId(): string {
    return this.orderIdValue;
  }

  get amount(): number {
    return this.amountValue;
  }

  get currency(): string {
    return this.currencyValue;
  }

  get method(): PaymentMethod {
    return this.methodValue;
  }

  get status(): PaymentTransactionStatus {
    return this.statusValue;
  }

  get transactionId(): string | undefined {
    return this.transactionIdValue;
  }

  get paymentGateway(): string | undefined {
    return this.paymentGatewayValue;
  }

  get notes(): string | undefined {
    return this.notesValue;
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  set status(value: PaymentTransactionStatus) {
    this.statusValue = value;
    this.updatedAtValue = new Date();
  }

  set transactionId(value: string | undefined) {
    this.transactionIdValue = value;
    this.updatedAtValue = new Date();
  }

  set notes(value: string | undefined) {
    this.notesValue = value;
    this.updatedAtValue = new Date();
  }

  isCompleted(): boolean {
    return this.statusValue === "completed";
  }

  toJSON(): Payment {
    return {
      id: this.idValue,
      orderId: this.orderIdValue,
      amount: this.amountValue,
      currency: this.currencyValue,
      method: this.methodValue,
      status: this.statusValue,
      transactionId: this.transactionIdValue,
      paymentGateway: this.paymentGatewayValue,
      notes: this.notesValue,
      createdAt: this.createdAtValue,
      updatedAt: this.updatedAtValue,
    };
  }

  static fromObject(data: Payment): PaymentEntity {
    return new PaymentEntity(
      data.id,
      data.orderId,
      data.amount,
      data.method,
      data.currency,
      data.status,
      data.transactionId,
      data.paymentGateway,
      data.notes,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromValidatedData(data: Payment): PaymentEntity {
    return PaymentEntity.fromObject(data);
  }

  static validateCreation(data: CreatePaymentInput): void {
    const result = CreatePaymentSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid payment creation data",
        result.error.issues.map((err) => ({
          field: Array.isArray(err.path) && err.path.length > 0 ? err.path.join(".") : "value",
          message: err.message,
        })),
      );
    }
  }

  static validateUpdate(data: UpdatePaymentInput): void {
    const result = UpdatePaymentSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(
        "Invalid payment update data",
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