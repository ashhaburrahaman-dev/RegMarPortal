import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJWT } from '../lib/jwt.js'
import type { Env, UserContext } from '../types.js'

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext
  }
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const token = getCookie(c, 'auth_token')

  if (!token) {
    return c.json({ error: 'Unauthorized — no auth token' }, 401)
  }

  try {
    const decoded = await verifyJWT(token, c.env.JWT_SECRET)
    c.set('user', decoded)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized — invalid or expired token' }, 401)
  }
}
