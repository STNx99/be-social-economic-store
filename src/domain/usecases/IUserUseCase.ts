import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
} from "@/utils/schemas";
import { ListUsersResponse } from "@/utils/schemas/endpoints";

export interface IUserUseCase {
  createUser(request: CreateUserRequest): Promise<CreateUserResponse>;
  getUser(request: GetUserRequest): Promise<GetUserResponse>;
  listUsers(page?: number, limit?: number): Promise<ListUsersResponse>;
  findUserByEmail(email: string): Promise<boolean>;
}