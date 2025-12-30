import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IUserUseCase } from "../../domain/usecases/IUserUseCase";
import { IAuthUseCase } from "../../domain/usecases/IAuthUseCase";
import { IWsUseCase } from "../../domain/usecases/IWsUseCase";
import { IWsRepository } from "../../domain/repositories/IWsRepository";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import { ICartRepository } from "../../domain/repositories/ICartRepository";
import { UserController } from "../../adapters/controllers/UserController";
import { AuthController } from "../../adapters/controllers/AuthController";
import { ProductController } from "../../adapters/controllers/ProductController";
import { CategoryController } from "../../adapters/controllers/CategoryController";
import { CartController } from "../../adapters/controllers/CartController";
import { UserRepository } from "@/adapters/repositories/UserRepository";
import { ProductRepository } from "@/adapters/repositories/ProductRepository";
import { CategoryRepository } from "@/adapters/repositories/CategoryRepository";
import { CartRepository } from "@/adapters/repositories/CartRepository";
import { WsRepository } from "@/adapters/repositories/WsRepository";
import { UserUseCase } from "@/application/usecases/UserUseCase";
import { AuthUseCase } from "@/application/usecases/AuthUseCase";
import { WsUseCase } from "@/application/usecases/WsUseCase";
import { ProductUseCase } from "@/application/usecases/ProductUseCase";
import { CategoryUseCase } from "@/application/usecases/CategoryUseCase";
import { CartUseCase } from "@/application/usecases/CartUseCase";
import { S3Service } from "@/infrastructure/s3/s3Service";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { ICategoryUseCase } from "@/domain/usecases/ICategoryUseCase";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";

export class Container {
  private static instance: Container;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private cartRepository: ICartRepository;
  private wsRepository: IWsRepository;
  private userUseCase: IUserUseCase;
  private authUseCase: IAuthUseCase;
  private wsUseCase: IWsUseCase;
  private productUseCase: IProductUseCase;
  private categoryUseCase: ICategoryUseCase;
  private cartUseCase: ICartUseCase;
  private userController: UserController;
  private authController: AuthController;
  private productController: ProductController;
  private categoryController: CategoryController;
  private cartController: CartController;
  private s3Service: S3Service;

  private constructor() {
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
    this.cartRepository = new CartRepository();
    this.wsRepository = new WsRepository();
    this.s3Service = new S3Service();

    this.userUseCase = new UserUseCase(this.userRepository);
    this.authUseCase = new AuthUseCase(this.userRepository);
    this.wsUseCase = new WsUseCase(this.wsRepository);
    this.productUseCase = new ProductUseCase(
      this.productRepository,
      this.s3Service,
      this.categoryRepository,
    );
    this.categoryUseCase = new CategoryUseCase(
      this.categoryRepository,
    );
    this.cartUseCase = new CartUseCase(
      this.cartRepository,
      this.productRepository,
    );

    this.userController = new UserController(this.userUseCase);
    this.authController = new AuthController(this.authUseCase);
    this.productController = new ProductController(this.productUseCase);
    this.categoryController = new CategoryController(this.categoryUseCase);
    this.cartController = new CartController(this.cartUseCase);
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

  getWsRepository(): IWsRepository {
    return this.wsRepository;
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

  getCategoryController(): CategoryController {
    return this.categoryController;
  }

  getCartController(): CartController {
    return this.cartController;
  }
}