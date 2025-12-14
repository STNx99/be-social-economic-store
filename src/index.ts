import { Hono } from 'hono'
import { setupUserRoutes } from './infrastructure/routes/userRoutes'
import { setupAuthRoutes } from './infrastructure/routes/authRoutes'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

setupUserRoutes(app)
setupAuthRoutes(app)

export default app