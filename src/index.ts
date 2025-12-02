import { Hono } from 'hono'
import { setupUserRoutes } from './infrastructure/routes/userRoutes'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

setupUserRoutes(app)

export default app