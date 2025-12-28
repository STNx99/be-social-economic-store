import { Context } from "hono";
import { IUserUseCase } from "@/domain/usecases/IUserUseCase";
import { StatusBuilder } from "@/utils";


export class UserController {
  constructor(private userUseCase: IUserUseCase) {}

  async getUser(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.userUseCase.getUser({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
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