import { UserEntity, DomainValidationError } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { validateData, ValidationError, StatusBuilder } from "@/utils";
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
  SanitizedUserInputSchema,
  UserIdParamSchema,
} from "@/utils/schemas";
import { CreateUserInput } from "@/utils/schemas/user";

interface IUserUseCase {
  createUser(request: CreateUserRequest): Promise<CreateUserResponse>;
  getUser(request: GetUserRequest): Promise<GetUserResponse>;
  findUserByEmail(email: string): Promise<boolean>;
}

export class UserUseCase implements IUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
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
          { field: "email", message: "Email address is already registered" },
        ]);
      }

      try {
        UserEntity.validateCreation(validatedInput);
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return StatusBuilder.fail("Validation failed", error.details);
        }
        throw error;
      }

      const user = new UserEntity(
        crypto.randomUUID(),
        validatedInput.email,
        validatedInput.name,
        validatedInput.password,
      );

      const savedUser = await this.userRepository.save(user);

      return StatusBuilder.ok(savedUser);
    } catch (error) {
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
        validatedParams = validateData(UserIdParamSchema, { id: request.id });
      } catch (error) {
        if (error instanceof ValidationError) {
          return StatusBuilder.fail("Invalid user ID", error.details);
        }
        throw error;
      }

      const user = await this.userRepository.findById(validatedParams.id);

      if (!user) {
        return StatusBuilder.fail("User not found", [
          { field: "id", message: "No user exists with the provided ID" },
        ]);
      }

      return StatusBuilder.ok(user);
    } catch (error) {
      return StatusBuilder.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
  async findUserByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return user !== null;
  }
}
