import bcrypt from "bcryptjs";
import { IUserUseCase } from "@/domain/usecases/IUserUseCase";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { UserEntity, DomainValidationError } from "@/domain/entities/User";
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
  ListUsersResponse,
} from "@/utils/schemas/endpoints/users";
import {
  SanitizedUserInputSchema,
  CreateUserInput,
  UserIdParamSchema,
} from "@/utils/schemas/user";
import { validateData, ValidationError, StatusBuilder } from "@/utils";

const DEFAULT_PASSWORD_SALT_ROUNDS = 10;

export class UserUseCase implements IUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      let sanitizedInput: CreateUserInput;

      try {
        sanitizedInput = validateData(SanitizedUserInputSchema, request);
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const existingUser = await this.userRepository.findByEmail(
        sanitizedInput.email,
      );

      if (existingUser) {
        return StatusBuilder.fail("Email already in use", [
          {
            field: "email",
            message: "A user with this email already exists",
          },
        ]);
      }

      try {
        UserEntity.validateCreation(sanitizedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const hashedPassword = await bcrypt.hash(
        sanitizedInput.password,
        DEFAULT_PASSWORD_SALT_ROUNDS,
      );

      const user = new UserEntity(
        crypto.randomUUID(),
        sanitizedInput.email,
        sanitizedInput.name,
        hashedPassword,
        sanitizedInput.role ?? "customer",
      );

      const savedUser = await this.userRepository.save(user.toJSON());

      return StatusBuilder.ok(savedUser);
    } catch (error: unknown) {
      if (error instanceof DomainValidationError) {
        return StatusBuilder.fail("Validation failed", error.details);
      }

      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    try {
      let validatedParams;
      try {
        validatedParams = validateData(UserIdParamSchema, {
          id: request.id,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid user ID", error.details);
        }
        throw error;
      }

      const user = await this.userRepository.findById(validatedParams.id);

      if (!user) {
        return StatusBuilder.fail("User not found", [
          {
            field: "id",
            message: "No user exists with the provided ID",
          },
        ]);
      }

      return StatusBuilder.ok(user);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async listUsers(page = 1, limit = 10): Promise<ListUsersResponse> {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    try {
      const users = await this.userRepository.findAll();
      const total = users.length;
      const skip = (normalizedPage - 1) * normalizedLimit;
      const paginatedUsers = users.slice(skip, skip + normalizedLimit);
      const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / normalizedLimit));

      return StatusBuilder.paginated(paginatedUsers, {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      });
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  async findUserByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return Boolean(user);
  }
}