import { UserEntity, DomainValidationError } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { CartEntity } from "@/domain/entities/Cart";
import { validateData, ValidationError, StatusBuilder } from "@/utils";
import { 
  AuthRegisterRequestSchema, 
  AuthLoginRequestSchema,
  AuthRegisterRequest,
  AuthRegisterResponse,
  AuthLoginRequest,
  AuthLoginResponse
} from "@/utils/schemas/endpoints/auth";
import { SanitizedUserInputSchema } from "@/utils/schemas";
import { CreateUserInput } from "@/utils/schemas/user";
import bcrypt from "bcryptjs";
import { generateAccessToken } from "@/utils/auth";

export class AuthUseCase {
  constructor(
    private userRepository: IUserRepository,
  ) {}

  async register(request: AuthRegisterRequest): Promise<AuthRegisterResponse> {
    try {
      let validatedInput: CreateUserInput;
      try {
        validatedInput = validateData(SanitizedUserInputSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const existingUser = await this.userRepository.findByEmail(
        validatedInput.email,
      );
      if (existingUser) {
        return StatusBuilder.fail("User with this email already exists", [
          {
            field: "email",
            message: "Email address is already registered",
          },
        ]);
      }

      // 3. Validate domain rules
      try {
        UserEntity.validateCreation(validatedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      // 4. Hash password
      const hashedPassword = await bcrypt.hash(validatedInput.password, 10);

      // 5. Tạo User entity
      const user = new UserEntity(
        crypto.randomUUID(),
        validatedInput.email,
        validatedInput.name,
        hashedPassword,
        validatedInput.role,
      );

      // Create empty cart for new user
      const cart = new CartEntity(
        crypto.randomUUID(),
        user.id,
        [],
        0,
      );

      await this.userRepository.createUserWithCart(user.toJSON(), cart.toJSON());

      return StatusBuilder.ok({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      if (error instanceof DomainValidationError) {
        return StatusBuilder.fail("Validation failed", error.details);
      }

      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async login(request: AuthLoginRequest): Promise<AuthLoginResponse> {
    try {
      // 1. Validate input
      let validatedInput;
      try {
        validatedInput = validateData(AuthLoginRequestSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const user = await this.userRepository.findByEmail(
        validatedInput.email.trim().toLowerCase(),
      );

      if (!user) {
        return StatusBuilder.fail("Invalid email or password", [
          {
            field: "email",
            message: "No account found with this email address",
          },
        ]);
      }

      // 3. Verify password
      const isPasswordValid = await bcrypt.compare(
        validatedInput.password,
        user.password,
      );

      if (!isPasswordValid) {
        return StatusBuilder.fail("Invalid email or password", [
          {
            field: "password",
            message: "Incorrect password",
          },
        ]);
      }

      const accessToken = generateAccessToken(user.id, user.role);

      return StatusBuilder.ok({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

}