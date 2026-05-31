import type { MiddlewareHandler } from 'hono'
import type { Env, UserContext } from '../types.js'

/**
 * Factory that returns a middleware allowing only users with the specified roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(roles: UserContext['role'][]): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!roles.includes(user.role as UserContext['role'])) {
      return c.json(
        { error: `Forbidden — required role: ${roles.join(' or ')}` },
        403
      )
    }

    await next()
  }
}
