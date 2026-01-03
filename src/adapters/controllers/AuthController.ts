import { Context } from "hono";
import { IAuthUseCase } from "@/domain/usecases/IAuthUseCase";
import { AuthRegisterRequest, AuthLoginRequest } from "@/utils/schemas/endpoints/auth";
import { StatusBuilder } from "@/utils";


export class AuthController {
  constructor(private authUseCase: IAuthUseCase) {}

  async register(c: Context) {
    try {
      const req: AuthRegisterRequest = await c.req.json();
      const response = await this.authUseCase.register(req);

      if (response.success) {
        return c.json(response, 201);
      } else {
        return c.json(response, 400);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Unknown error",
        ),
        500,
      );
    }
  }

  async login(c: Context) {
    try {
      const req: AuthLoginRequest = await c.req.json();
      const response = await this.authUseCase.login(req);

      if (response.success) {
        return c.json(response, 200);
      } else {
        console.log(response)
        return c.json(response, 401);
      }
    } catch (error) {
      return c.json(
        StatusBuilder.fail(
          error instanceof Error ? error.message : "Unknown error",
        ),
        500,
      );
    }
  }
}