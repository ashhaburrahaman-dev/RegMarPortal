import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { LoginSchema } from '@regmar/shared'
import { requireAuth } from '../middleware/requireAuth.js'
import { attemptLogin } from '../services/authService.js'
import { getDb } from '../db/client.js'
import { users } from '../db/schema.js'
import type { Env } from '../types.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict' as const,
  maxAge: 28800, // 8 hours
  path: '/',
}

const auth = new Hono<{ Bindings: Env }>()

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { username, password } = c.req.valid('json')
  const ipAddress = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? null

  const result = await attemptLogin(c.env, username, password, ipAddress)

  if (!result.success) {
    if (result.code === 'LOCKED') {
      return c.json(
        {
          error: 'Account is temporarily locked due to too many failed attempts',
          lockedUntil: result.lockedUntil,
        },
        423
      )
    }
    return c.json({ error: 'Invalid username or password' }, 401)
  }

  // Set HTTP-only auth cookie
  setCookie(c, 'auth_token', result.token, COOKIE_OPTIONS)

  // Set readable CSRF cookie (non-HTTP-only so JS can read it)
  setCookie(c, 'csrf_token', result.csrfToken, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  })

  return c.json({
    user: {
      id: result.userId,
      fullName: result.fullName,
      role: result.role,
    },
  })
})

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
auth.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  deleteCookie(c, 'csrf_token', { path: '/' })
  return c.json({ message: 'Logged out successfully' })
})

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
auth.get('/me', requireAuth, async (c) => {
  const contextUser = c.get('user')
  const db = getDb(c.env.DB)

  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      role: users.role,
      lastLogin: users.lastLogin,
    })
    .from(users)
    .where(eq(users.id, contextUser.sub))
    .limit(1)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

export default auth
