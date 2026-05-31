import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './types.js'
import authRoutes from './routes/auth.js'
import marriageRoutes from './routes/marriages.js'
import memoRoutes from './routes/memo.js'
import pincodeRoutes from './routes/pincode.js'
import pdfRoutes from './routes/pdf.js'
import certificateRoutes from './routes/certificate.js'

const app = new Hono<{ Bindings: Env }>()

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', async (c, next) => {
  return cors({
    origin: c.env.ALLOWED_ORIGIN,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-CSRF-Token'],
    exposeHeaders: ['Content-Disposition'],
    maxAge: 600,
  })(c, next)
})

// ─── Security headers ─────────────────────────────────────────────────────────
app.use('*', secureHeaders())

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/marriages', marriageRoutes)
app.route('/api/v1/memo', memoRoutes)
app.route('/api/v1/pincode', pincodeRoutes)
app.route('/api/v1/pdf', pdfRoutes)
app.route('/api/v1/certificate', certificateRoutes)

// ─── 404 / Error handlers ─────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('[Worker Error]', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
