import { User, Cart } from "@/utils/schemas";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<User[]>;
  createUserWithCart(user: User, cart: Cart): Promise<void>;
}
