# Social Economic Store - Backend

A backend application built with **Clean Architecture** principles using Hono and Bun, featuring comprehensive validation across all layers.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

The server will start at `http://localhost:3000`

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Create User

```bash
POST /users
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```

Response (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get User

```bash
GET /users/{id}
```

Response (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Validation Architecture

This project implements **layered validation** following Clean Architecture principles:

### 🏗️ Infrastructure Layer - Input Validation

- **JSON parsing** and structure validation
- **Basic type checking** (string, number, etc.)
- **Input sanitization** (trimming, lowercasing)
- **Early rejection** of malformed requests

**Location**: `src/infrastructure/middleware/validation.ts`

**Example**: Middleware validates request structure before reaching business logic:

```typescript
app.post(
  "/users",
  validateJsonBody(), // Parse JSON
  validateUserCreation(), // Validate structure
  (c) => controller.createUser(c),
);
```

### ⚙️ Application Layer - Use Case Validation

- **Required fields** validation
- **Business workflow** constraints
- **Data integrity** checks
- **Cross-field validation**

**Location**: `src/application/usecases/`

**Example**: Use case validates business requirements:

```typescript
if (!request.email || !request.name) {
  return { success: false, error: "Email and name are required" };
}
```

### 💎 Domain Layer - Business Rule Validation

- **Entity invariants** (business rules)
- **Format validation** (email, phone, etc.)
- **Business constraints** (age limits, etc.)
- **Pure business logic**

**Location**: `src/domain/entities/`

**Example**: Entity validates its own business rules:

```typescript
isValidEmail(): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(this.email);
}
```

### Validation Flow Example

```
HTTP Request → Infrastructure Validation → Controller → Use Case Validation → Domain Validation → Response
     ↓               ↓                        ↓             ↓                  ↓            ↓
  Invalid JSON   Malformed request      Missing fields   Business rules    Email format  Success
     ↓               ↓                        ↓             ↓                  ↓            ↓
   400 Error       400 Error             400 Error       400 Error         400 Error    201 Created
```

## Architecture

This project follows **Clean Architecture** principles for maintainability, testability, and scalability.

### Directory Structure

```
src/
├── domain/                 # Core business logic (framework-independent)
│   ├── entities/          # Domain models with business rules
│   └── repositories/      # Repository interfaces (contracts)
├── application/           # Application business rules
│   └── usecases/         # Use cases (business workflows)
├── adapters/             # Interface adapters
│   ├── controllers/      # HTTP request handlers
│   └── repositories/     # Repository implementations
├── infrastructure/       # Frameworks & drivers
│   ├── dependencies/     # Dependency injection container
│   ├── middleware/       # HTTP middleware (validation, etc.)
│   └── routes/          # HTTP route definitions
└── index.ts             # Entry point
```

### Key Principles

1. **Independence of Frameworks** - Core logic doesn't depend on Hono or Bun
2. **Testability** - Business logic can be tested without HTTP or database
3. **Dependency Inversion** - Dependencies flow inward toward the domain
4. **Separation of Concerns** - Each layer has a single responsibility
5. **Layered Validation** - Each layer validates what it cares about

## Technologies

- **Language**: TypeScript
- **Runtime**: Bun
- **Framework**: Hono.js
- **Architecture**: Clean Architecture (Uncle Bob)
- **Validation**: Layered validation approach

## Documentation

| File                          | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `QUICKSTART.md`               | Quick start guide and basic usage            |
| `ARCHITECTURE.md`             | Detailed architecture documentation          |
| `CLEAN_ARCHITECTURE_GUIDE.md` | Visual architecture guide with diagrams      |
| `TESTING_GUIDE.md`            | Comprehensive testing guide with examples    |
| `VALIDATION_GUIDE.md`         | Complete validation guide and best practices |

## API Error Responses

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Adding New Features

1. **Create Domain Entity** with business validation
2. **Create Repository Interface** for data access
3. **Create Use Case** with workflow validation
4. **Create Repository Implementation**
5. **Create Controller** for HTTP handling
6. **Add Validation Middleware** for input validation
7. **Update Container** and routes

### DynamoDB (optional)

This project supports using AWS DynamoDB as a persistence store for users. You can enable the DynamoDB-backed repository and control initialization behavior with the environment variables below.

Install the AWS SDK (v3) document client packages:

```bash
bun add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

Important environment variables (connection & initialization)

- `DYNAMODB_TABLE_USERS` — Table name to use for user storage. Setting this switches the app to the DynamoDB-backed repository. Default: `Users`.
- `USE_DYNAMODB` — Alternate flag to enable Dynamo usage (set to `true`).
- `DYNAMODB_USERS_EMAIL_INDEX` — Optional GSI name where `email` is the partition key. If provided, the repository will query this index for email lookups (efficient `Query`); the initializer will create the index when auto-creating the table.
- `DYNAMODB_ENDPOINT` — Optional endpoint for local DynamoDB (e.g. `http://localhost:8000`). If omitted the SDK talks to AWS-managed DynamoDB.
- `AWS_REGION` — AWS region for the client (defaults to `us-east-1`).
- `DYNAMODB_AUTO_CREATE_TABLE` — If `true`, the app will create the configured table (and optional GSI) automatically at startup when the table is missing.
- `DYNAMODB_FAIL_ON_INIT` — If `true`, initialization errors are treated as fatal and will fail startup; otherwise initialization errors are logged and startup continues.
- `DYNAMODB_INIT_ON_IMPORT` — If `true` the initializer will run automatically as soon as the module is imported (useful for some environments).

Example (local dev with DynamoDB Local)

```bash
export AWS_ACCESS_KEY_ID=fake
export AWS_SECRET_ACCESS_KEY=fake
export AWS_REGION=us-east-1
export DYNAMODB_ENDPOINT=http://localhost:8000
export DYNAMODB_TABLE_USERS=Users
export DYNAMODB_USERS_EMAIL_INDEX=email-index
export DYNAMODB_AUTO_CREATE_TABLE=true
export DYNAMODB_FAIL_ON_INIT=false

DYNAMODB_TABLE_USERS=Users DYNAMODB_ENDPOINT=http://localhost:8000 bun run dev
```

Notes & best practices

- If you have a GSI for `email`, set `DYNAMODB_USERS_EMAIL_INDEX` to that index — lookups become `Query` operations (fast). If not set, the repository falls back to `Scan` (inefficient at scale).
- For production, prefer IAM roles (ECS/Lambda/EC2) and grant least-privilege DynamoDB actions (GetItem/PutItem/DeleteItem/Query/Scan) on the table and index ARNs.
- The initializer waits for the table to become `ACTIVE` (default wait is ~60s). Use `DYNAMODB_FAIL_ON_INIT=true` to make initialization failures fatal.
- Code references:
  - `src/infrastructure/dynamodb/initializer.ts` — table initialization and health checks
  - `src/infrastructure/dynamodb/dynamoClient.ts` — client wrapper
  - `src/adapters/repositories/DynamoUserRepository.ts` — Dynamo-backed repository
  - `src/infrastructure/dependencies/Container.ts` — repository selection logic
- Do not commit AWS credentials to source control.

### Testing

```bash
# Run tests (when implemented)
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Validation Testing

Each validation layer should be tested independently:

- **Infrastructure**: Test middleware with invalid requests
- **Application**: Test use cases with mock repositories
- **Domain**: Test entity business rules

## Project Structure Details

```
be-social-economic-store/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── User.ts              # User entity with business validation
│   │   └── repositories/
│   │       └── IUserRepository.ts   # Data access contract
│   │
│   ├── application/
│   │   └── usecases/
│   │       ├── CreateUserUseCase.ts # User creation with workflow validation
│   │       └── GetUserUseCase.ts    # User retrieval logic
│   │
│   ├── adapters/
│   │   ├── controllers/
│   │   │   └── UserController.ts    # HTTP request handling
│   │   └── repositories/
│   │       └── InMemoryUserRepository.ts # In-memory data storage
│   │
│   ├── infrastructure/
│   │   ├── dependencies/
│   │   │   └── Container.ts         # Dependency injection
│   │   ├── middleware/
│   │   │   └── validation.ts        # Input validation middleware
│   │   └── routes/
│   │       └── userRoutes.ts        # Route definitions with validation
│   │
│   └── index.ts                     # Application entry point
│
├── *.md                             # Documentation files
├── package.json
├── tsconfig.json
└── bun.lock
```

## Key Benefits

| Aspect                   | Benefit                                           |
| ------------------------ | ------------------------------------------------- |
| **Validation**           | Defense-in-depth approach across all layers       |
| **Testability**          | Each validation layer can be tested independently |
| **Maintainability**      | Clear separation of validation concerns           |
| **Security**             | Multiple validation layers prevent invalid data   |
| **Performance**          | Early validation prevents unnecessary processing  |
| **Developer Experience** | Clear error messages and validation feedback      |

## Contributing

1. Follow the Clean Architecture principles
2. Add validation at the appropriate layer
3. Write tests for each validation layer
4. Update documentation as needed
5. Ensure all layers work together seamlessly

## License

MIT
