import { UserEntity, DomainValidationError } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
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

export class AuthUseCase {
  constructor(private userRepository: IUserRepository) {}

  async register(request: AuthRegisterRequest): Promise<AuthRegisterResponse> {
    try {
      // 1. Validate input với schema
      let validatedInput: CreateUserInput;
      try {
        validatedInput = validateData(SanitizedUserInputSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      // 2. Check email đã tồn tại chưa
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
      );

      // 6. Lưu vào repository (memory)
      const savedUser = await this.userRepository.save(user);

      // 7. Return response (không trả về password)
      return StatusBuilder.ok({
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
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

      // 2. Tìm user theo email
      const user = await this.userRepository.findByEmail(
        validatedInput.email.toLowerCase().trim(),
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

      // 4. Generate access token (simple token cho demo, production nên dùng JWT)
      const accessToken = this.generateAccessToken(user.id);

      // 5. Return response
      return StatusBuilder.ok({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  private generateAccessToken(userId: string): string {
    // Simple token generation (production nên dùng JWT)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return Buffer.from(`${userId}:${timestamp}:${random}`).toString("base64");
  }
}

