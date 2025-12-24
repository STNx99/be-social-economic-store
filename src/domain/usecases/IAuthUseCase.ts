import {
  AuthRegisterRequest,
  AuthRegisterResponse,
  AuthLoginRequest,
  AuthLoginResponse,
} from "@/utils/schemas/endpoints/auth";

export interface IAuthUseCase {
  register(request: AuthRegisterRequest): Promise<AuthRegisterResponse>;
  login(request: AuthLoginRequest): Promise<AuthLoginResponse>;
}