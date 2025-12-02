import { z } from "zod";
import {
  UserSchema,
  CreateUserSchema,
  CreateUserInput,
  UpdateUserSchema,
  UpdateUserInput,
  User,
} from "@/utils/schemas/user";

export class UserEntity implements User {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly password: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    name: string,
    password: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    const userData = { id, email, name, password, createdAt, updatedAt };
    const result = UserSchema.safeParse(userData);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError("Invalid User data", errors);
    }

    this.id = result.data.id;
    this.email = result.data.email;
    this.name = result.data.name;
    this.password = result.data.password;
    this.createdAt = result.data.createdAt;
    this.updatedAt = result.data.updatedAt;
  }

  static fromValidatedData(data: User): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.name,
      data.password,
      data.createdAt,
      data.updatedAt,
    );
  }

  static validateCreation(input: CreateUserInput): void {
    const result = CreateUserSchema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError(
        "Invalid User creation data",
        errors,
      );
    }
  }

  static validateUpdate(input: UpdateUserInput): void {
    const result = UpdateUserSchema.safeParse(input);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.core.$ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new DomainValidationError("Invalid User update data", errors);
    }
  }

  updateName(newName: string): UserEntity {
    UserEntity.validateUpdate({ name: newName });

    return new UserEntity(
      this.id,
      this.email,
      newName,
      this.password,
      this.createdAt,
      new Date(),
    );
  }

  updateEmail(newEmail: string): UserEntity {
    UserEntity.validateUpdate({ email: newEmail });

    return new UserEntity(
      this.id,
      newEmail,
      this.name,
      this.password,
      this.createdAt,
      new Date(),
    );
  }

  canBeDeleted(): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt <= oneDayAgo;
  }

  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isRecentlyCreated(): boolean {
    return this.getAgeInDays() <= 7;
  }

  toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class DomainValidationError extends Error {
  constructor(
    message: string,
    public readonly details: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "DomainValidationError";
  }
}
