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
app.post('/users', 
  validateJsonBody(),        // Parse JSON
  validateUserCreation(),    // Validate structure
  (c) => controller.createUser(c)
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
  return { success: false, error: 'Email and name are required' };
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

| File | Purpose |
|------|---------|
| `QUICKSTART.md` | Quick start guide and basic usage |
| `ARCHITECTURE.md` | Detailed architecture documentation |
| `CLEAN_ARCHITECTURE_GUIDE.md` | Visual architecture guide with diagrams |
| `TESTING_GUIDE.md` | Comprehensive testing guide with examples |
| `VALIDATION_GUIDE.md` | Complete validation guide and best practices |

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

| Aspect | Benefit |
|--------|---------|
| **Validation** | Defense-in-depth approach across all layers |
| **Testability** | Each validation layer can be tested independently |
| **Maintainability** | Clear separation of validation concerns |
| **Security** | Multiple validation layers prevent invalid data |
| **Performance** | Early validation prevents unnecessary processing |
| **Developer Experience** | Clear error messages and validation feedback |

## Contributing

1. Follow the Clean Architecture principles
2. Add validation at the appropriate layer
3. Write tests for each validation layer
4. Update documentation as needed
5. Ensure all layers work together seamlessly

## License

MIT