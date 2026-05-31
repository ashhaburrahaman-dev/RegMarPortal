import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { validateCsrfTokens } from '../lib/csrf.js'
import type { Env } from '../types.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF protection middleware.
 * Skips safe methods (GET, HEAD, OPTIONS).
 * Validates that the csrf_token cookie matches the X-CSRF-Token header.
 */
export const csrfProtect: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next()
    return
  }

  const cookieToken = getCookie(c, 'csrf_token')
  const headerToken = c.req.header('X-CSRF-Token')

  if (!validateCsrfTokens(cookieToken, headerToken)) {
    return c.json({ error: 'CSRF validation failed' }, 403)
  }

  await next()
}
