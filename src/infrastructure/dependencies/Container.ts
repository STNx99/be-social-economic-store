import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserController } from "../../adapters/controllers/UserController";
import { UserRepository } from "../../adapters/repositories/UserRepository";
import { UserUseCase } from "../../application/usecases/UserUseCase";

export class Container {
  private static instance: Container;
  private userRepository: IUserRepository;
  private userUseCase: UserUseCase;
  private userController: UserController;

  private constructor() {
    this.userRepository = new UserRepository();
    this.userUseCase = new UserUseCase(this.userRepository);
    this.userController = new UserController(this.userUseCase);
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
}
