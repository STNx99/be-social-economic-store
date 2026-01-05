import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IUserUseCase } from "../../domain/usecases/IUserUseCase";
import { IAuthUseCase } from "../../domain/usecases/IAuthUseCase";
import { IWsUseCase } from "../../domain/usecases/IWsUseCase";
import { IWsRepository } from "../../domain/repositories/IWsRepository";
import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { IShipmentRepository } from "../../domain/repositories/IShipmentRepository";
import { ICartRepository } from "../../domain/repositories/ICartRepository";
import { UserController } from "../../adapters/controllers/UserController";
import { AuthController } from "../../adapters/controllers/AuthController";
import { ProductController } from "../../adapters/controllers/ProductController";
import { CategoryController } from "../../adapters/controllers/CategoryController";
import { OrderController } from "../../adapters/controllers/OrderController";
import { PaymentController } from "../../adapters/controllers/PaymentController";
import { ShipmentController } from "../../adapters/controllers/ShipmentController";
import { CartController } from "../../adapters/controllers/CartController";
import { UserRepository } from "@/adapters/repositories/UserRepository";
import { ProductRepository } from "@/adapters/repositories/ProductRepository";
import { CategoryRepository } from "@/adapters/repositories/CategoryRepository";
import { OrderRepository } from "@/adapters/repositories/OrderRepository";
import { PaymentRepository } from "@/adapters/repositories/PaymentRepository";
import { ShipmentRepository } from "@/adapters/repositories/ShipmentRepository";
import { CartRepository } from "@/adapters/repositories/CartRepository";
import { WsRepository } from "@/adapters/repositories/WsRepository";
import { AuthUseCase } from "@/application/usecases/AuthUseCase";
import { WsUseCase } from "@/application/usecases/WsUseCase";
import { ProductUseCase } from "@/application/usecases/ProductUseCase";
import { CategoryUseCase } from "@/application/usecases/CategoryUseCase";
import { OrderUseCase } from "@/application/usecases/OrderUseCase";
import { PaymentUseCase } from "@/application/usecases/PaymentUseCase";
import { ShipmentUseCase } from "@/application/usecases/ShipmentUseCase";
import { CartUseCase } from "@/application/usecases/CartUseCase";
import { S3Service } from "@/infrastructure/s3/s3Service";
import { IProductUseCase } from "@/domain/usecases/IProductUseCase";
import { ICategoryUseCase } from "@/domain/usecases/ICategoryUseCase";
import { IOrderUseCase } from "@/domain/usecases/IOrderUseCase";
import { IPaymentUseCase } from "@/domain/usecases/IPaymentUseCase";
import { IShipmentUseCase } from "@/domain/usecases/IShipmentUseCase";
import { ICartUseCase } from "@/domain/usecases/ICartUseCase";
import { IInventoryRepository } from "@/domain/repositories/IInventoryRepository";
import { IInventoryUseCase } from "@/domain/usecases/IInventoryUseCase";
import { InventoryRepository } from "@/adapters/repositories/InventoryRepository";
import { InventoryUseCase } from "@/application/usecases/InventoryUseCase";
import { InventoryController } from "@/adapters/controllers/InventoryController";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReviewUseCase } from "@/domain/usecases/IReviewUseCase";
import { ReviewRepository } from "@/adapters/repositories/ReviewRepository";
import { ReviewUseCase } from "@/application/usecases/ReviewUseCase";
import { ReviewController } from "@/adapters/controllers/ReviewController";
import { IProductVariantRepository } from "@/domain/repositories/IProductVariantRepository";
import { IProductVariantUseCase } from "@/domain/usecases/IProductVariantUseCase";
import { ProductVariantRepository } from "@/adapters/repositories/ProductVariantRepository";
import { ProductVariantUseCase } from "@/application/usecases/ProductVariantUseCase";
import { ProductVariantController } from "@/adapters/controllers/ProductVariantController";
import { IUploadUseCase } from "@/domain/usecases/IUploadUseCase";
import { UploadUseCase } from "@/application/usecases/UploadUseCase";
import { UploadController } from "@/adapters/controllers/UploadController";
import { UserUseCase } from "@/application/usecases/UserUseCase";

export class Container {
  private static instance: Container;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private orderRepository: IOrderRepository;
  private paymentRepository: IPaymentRepository;
  private shipmentRepository: IShipmentRepository;
  private cartRepository: ICartRepository;
  private inventoryRepository: IInventoryRepository;
  private reviewRepository: IReviewRepository;
  private productVariantRepository: IProductVariantRepository;
  private wsRepository: IWsRepository;
  private userUseCase: IUserUseCase;
  private authUseCase: IAuthUseCase;
  private wsUseCase: IWsUseCase;
  private productUseCase: IProductUseCase;
  private categoryUseCase: ICategoryUseCase;
  private orderUseCase: IOrderUseCase;
  private paymentUseCase: IPaymentUseCase;
  private shipmentUseCase: IShipmentUseCase;
  private cartUseCase: ICartUseCase;
  private inventoryUseCase: IInventoryUseCase;
  private reviewUseCase: IReviewUseCase;
  private productVariantUseCase: IProductVariantUseCase;
  private uploadUseCase: IUploadUseCase;
  private userController: UserController;
  private authController: AuthController;
  private productController: ProductController;
  private categoryController: CategoryController;
  private orderController: OrderController;
  private paymentController: PaymentController;
  private shipmentController: ShipmentController;
  private cartController: CartController;
  private inventoryController: InventoryController;
  private reviewController: ReviewController;
  private productVariantController: ProductVariantController;
  private uploadController: UploadController;
  private s3Service: S3Service;

  private constructor() {
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
    this.orderRepository = new OrderRepository();
    this.paymentRepository = new PaymentRepository();
    this.shipmentRepository = new ShipmentRepository();
    this.cartRepository = new CartRepository();
    this.inventoryRepository = new InventoryRepository();
    this.reviewRepository = new ReviewRepository();
    this.productVariantRepository = new ProductVariantRepository();
    this.wsRepository = new WsRepository();
    this.s3Service = new S3Service();

    this.userUseCase = new UserUseCase(this.userRepository);
    this.authUseCase = new AuthUseCase(this.userRepository);
    this.wsUseCase = new WsUseCase(this.wsRepository);
    this.productVariantUseCase = new ProductVariantUseCase(
      this.productVariantRepository,
      this.productRepository,
      this.inventoryRepository,
    );
    this.productUseCase = new ProductUseCase(
      this.productRepository,
      this.s3Service,
      this.categoryRepository,
      this.inventoryRepository,
      this.productVariantUseCase,
    );
    this.categoryUseCase = new CategoryUseCase(
      this.categoryRepository,
    );
    this.paymentUseCase = new PaymentUseCase(this.paymentRepository, this.orderRepository);
    this.orderUseCase = new OrderUseCase(
      this.orderRepository,
      this.cartRepository,
      this.productRepository,
      this.productVariantRepository,
      this.paymentUseCase,
    );
    this.shipmentUseCase = new ShipmentUseCase(this.shipmentRepository, this.orderRepository);
    this.cartUseCase = new CartUseCase(
      this.cartRepository,
      this.productRepository,
      this.productVariantRepository,
    );
    this.inventoryUseCase = new InventoryUseCase(
      this.inventoryRepository,
      this.productRepository,
      this.productVariantRepository,
    );
    this.reviewUseCase = new ReviewUseCase(
      this.reviewRepository,
      this.orderRepository,
      this.userRepository,
    );

    this.uploadUseCase = new UploadUseCase(this.s3Service);

    this.userController = new UserController(this.userUseCase);
    this.authController = new AuthController(this.authUseCase);
    this.productController = new ProductController(this.productUseCase);
    this.categoryController = new CategoryController(this.categoryUseCase);
    this.orderController = new OrderController(this.orderUseCase);
    this.paymentController = new PaymentController(this.paymentUseCase);
    this.shipmentController = new ShipmentController(this.shipmentUseCase);
    this.cartController = new CartController(this.cartUseCase);
    this.inventoryController = new InventoryController(this.inventoryUseCase);
    this.reviewController = new ReviewController(this.reviewUseCase);
    this.productVariantController = new ProductVariantController(
      this.productVariantUseCase,
    );
    this.uploadController = new UploadController(this.uploadUseCase);
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

  getOrderController(): OrderController {
    return this.orderController;
  }

  getPaymentController(): PaymentController {
    return this.paymentController;
  }

  getShipmentController(): ShipmentController {
    return this.shipmentController;
  }

  getCartController(): CartController {
    return this.cartController;
  }

  getInventoryController(): InventoryController {
    return this.inventoryController;
  }

  getReviewController(): ReviewController {
    return this.reviewController;
  }

  getProductVariantController(): ProductVariantController {
    return this.productVariantController;
  }

  getUploadController(): UploadController {
    return this.uploadController;
  }

  getProductUseCase(): IProductUseCase {
    return this.productUseCase;
  }
}
