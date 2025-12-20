import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserController } from "../../adapters/controllers/UserController";
import { AuthController } from "../../adapters/controllers/AuthController";
import { UserUseCase } from "../../application/usecases/UserUseCase";
import { AuthUseCase } from "../../application/usecases/AuthUseCase";
import { UserRepository } from "@/adapters/repositories/UserRepository";

export class Container {
  private static instance: Container;
  private userRepository: IUserRepository;
  private userUseCase: UserUseCase;
  private authUseCase: AuthUseCase;
  private userController: UserController;
  private authController: AuthController;

  private constructor() {
    this.userRepository = new UserRepository();

    this.userUseCase = new UserUseCase(this.userRepository);
    this.authUseCase = new AuthUseCase(this.userRepository);
    this.userController = new UserController(this.userUseCase);
    this.authController = new AuthController(this.authUseCase);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getUserController(): UserController {
    return this.userController;
  }

  getAuthController(): AuthController {
    return this.authController;
  }
}
