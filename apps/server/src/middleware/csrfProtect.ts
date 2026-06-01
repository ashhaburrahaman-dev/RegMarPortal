import type { FastifyRequest, FastifyReply } from 'fastify'
import { validateCsrfToken } from '../lib/csrf.js'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export async function csrfProtect(request: FastifyRequest, reply: FastifyReply) {
  if (SAFE_METHODS.includes(request.method)) return

  const cookieToken = request.cookies['csrf_token']
  const headerToken = request.headers['x-csrf-token'] as string | undefined

  if (!validateCsrfToken(cookieToken, headerToken)) {
    return reply.status(403).send({ error: 'Invalid or missing CSRF token' })
  }
}
