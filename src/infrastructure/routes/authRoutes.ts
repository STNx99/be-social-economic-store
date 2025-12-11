import { Hono } from 'hono';
import { Container } from '@/infrastructure/dependencies/Container';
import { validateWithZod } from '@/utils/validation';
import { AuthLoginRequestSchema, AuthRegisterRequestSchema } from '@/utils/schemas/endpoints/auth';

export function setupAuthRoutes(app: Hono) {
  const container = Container.getInstance();
  const authController = container.getAuthController();

  //register endpoint 
  app.post('/api/auth/register',
  validateWithZod(AuthRegisterRequestSchema),
  (c) => authController.register(c)
  );

  //login endpoint 
  app.post('/api/auth/login',
  validateWithZod(AuthLoginRequestSchema),
  (c) => authController.login(c)
  );
}

