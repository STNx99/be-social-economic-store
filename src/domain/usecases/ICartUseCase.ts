import {
  AddToCartRequest,
  AddToCartResponse,
  GetCartRequest,
  GetCartResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
  RemoveFromCartRequest,
  RemoveFromCartResponse,
  ClearCartRequest,
  ClearCartResponse,
} from "@/utils/schemas/endpoints/cart";

export interface ICartUseCase {
  addToCart(request: AddToCartRequest, userId: string): Promise<AddToCartResponse>;
  getCart(request: GetCartRequest): Promise<GetCartResponse>;
  updateCartItem(request: UpdateCartItemRequest, userId: string): Promise<UpdateCartItemResponse>;
  removeFromCart(request: RemoveFromCartRequest, userId: string): Promise<RemoveFromCartResponse>;
  clearCart(request: ClearCartRequest): Promise<ClearCartResponse>;
}

