import { Hono } from 'hono';
import { Container } from '@/infrastructure/dependencies/Container';
import { validateUserId } from '@/utils/validation';
import { requireAuth, requireAdmin } from '@/infrastructure/middleware/auth';

export function setupUserRoutes(app: Hono) {
  const container = Container.getInstance();
  const userController = container.getUserController();

  app.get('/api/users',
    requireAuth(),
    requireAdmin(),
    (c) => userController.listUsers(c)
  );

  app.get('/api/users/:id', 
    validateUserId(),
    (c) => userController.getUser(c)
  );
}