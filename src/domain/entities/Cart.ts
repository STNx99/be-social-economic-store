import {
  CartItem,
  Cart,
} from "@/utils/schemas/cart";

export class CartEntity implements Cart {
  private idValue: string;
  private userIdValue: string;
  private itemsValue: CartItem[];
  private totalValue: number;
  private createdAtValue: Date;
  private updatedAtValue: Date;

  constructor(
    id: string,
    userId: string,
    items: CartItem[] = [],
    total: number = 0,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.idValue = id;
    this.userIdValue = userId;
    this.itemsValue = items;
    this.totalValue = total;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get id(): string {
    return this.idValue;
  }

  get userId(): string {
    return this.userIdValue;
  }

  get items(): CartItem[] {
    return this.itemsValue;
  }

  get total(): number {
    return this.totalValue;
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  addItem(item: CartItem): void {
    const existingItemIndex = this.itemsValue.findIndex(
      (i) => i.productId === item.productId
    );

    if (existingItemIndex >= 0) {
      this.itemsValue[existingItemIndex].quantity += item.quantity;
    } else {
      this.itemsValue.push(item);
    }

    this.recalculateTotal();
    this.updatedAtValue = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const itemIndex = this.itemsValue.findIndex(
      (i) => i.productId === productId
    );

    if (itemIndex >= 0) {
      this.itemsValue[itemIndex].quantity = quantity;
      this.recalculateTotal();
      this.updatedAtValue = new Date();
    }
  }

  removeItem(productId: string): void {
    this.itemsValue = this.itemsValue.filter(
      (i) => i.productId !== productId
    );
    this.recalculateTotal();
    this.updatedAtValue = new Date();
  }

  private recalculateTotal(): void {
    this.totalValue = this.itemsValue.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  clear(): void {
    this.itemsValue = [];
    this.totalValue = 0;
    this.updatedAtValue = new Date();
  }

  toJSON(): Cart {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      total: this.total,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromValidatedData(data: Cart): CartEntity {
    return new CartEntity(
      data.id,
      data.userId,
      data.items,
      data.total,
      data.createdAt,
      data.updatedAt,
    );
  }
}

