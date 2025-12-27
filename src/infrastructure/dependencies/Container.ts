import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IUserUseCase } from "../../domain/usecases/IUserUseCase";
import { IAuthUseCase } from "../../domain/usecases/IAuthUseCase";
import { IWsUseCase } from "../../domain/usecases/IWsUseCase";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { UserController } from "../../adapters/controllers/UserController";
import { AuthController } from "../../adapters/controllers/AuthController";
import { ProductController } from "../../adapters/controllers/ProductController";
import { UserRepository } from "@/adapters/repositories/UserRepository";
import { ProductRepository } from "@/adapters/repositories/ProductRepository";
import { UserUseCase } from "@/application/usecases/UserUseCase";
import { AuthUseCase } from "@/application/usecases/AuthUseCase";
import { WsUseCase } from "@/application/usecases/WsUseCase";
import { ProductUseCase } from "@/application/usecases/ProductUseCase";
import { S3Service } from "@/infrastructure/s3/s3Service";

export class Container {
  private static instance: Container;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private userUseCase: IUserUseCase;
  private authUseCase: IAuthUseCase;
  private wsUseCase: IWsUseCase;
  private productUseCase: ProductUseCase;
  private userController: UserController;
  private authController: AuthController;
  private productController: ProductController;
  private s3Service: S3Service;

  private constructor() {
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
    this.s3Service = new S3Service();

    this.userUseCase = new UserUseCase(this.userRepository);
    this.authUseCase = new AuthUseCase(this.userRepository);
    this.wsUseCase = new WsUseCase(this.userRepository);
    this.productUseCase = new ProductUseCase(this.productRepository);

    this.userController = new UserController(this.userUseCase);
    this.authController = new AuthController(this.authUseCase);
    this.productController = new ProductController(this.productUseCase, this.s3Service);
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

  getProductRepository(): IProductRepository {
    return this.productRepository;
  }

  getUserController(): UserController {
    return this.userController;
  }

  getAuthController(): AuthController {
    return this.authController;
  }

  getWsUseCase(): IWsUseCase {
    return this.wsUseCase;
  }

  getProductController(): ProductController {
    return this.productController;
  }
}
