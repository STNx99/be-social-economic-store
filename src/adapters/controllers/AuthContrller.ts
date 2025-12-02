import { UserUseCase } from "@/application/usecases/UserUseCase";
import { AuthRegisterRequest } from "@/utils/schemas/endpoints/auth";
import { Context } from "hono";

export class AuthController {
  constructor(private userUserCase: UserUseCase) {}
  async register(c: Context) {
    const req : AuthRegisterRequest = await c.req.json();
    const result = this.userUserCase.findUserByEmail(req.email);
    if (!result) {
      return c.json({ success: false, error: "Email already in use" }, 400);
    }
    try {
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  }
  async login(c: Context) {
    try {
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  }
}
