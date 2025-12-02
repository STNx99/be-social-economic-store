import { Context } from "hono";
import { UserUseCase } from "../../application/usecases/UserUseCase";

export class UserController {
  constructor(private userUserCase: UserUseCase) {}

  async getUser(c: Context) {
    try {
      const id = c.req.param("id");
      const response = await this.userUserCase.getUser({ id });

      if (response.success) {
        return c.json(response, 200);
      } else {
        return c.json(response, 404);
      }
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  }
}
