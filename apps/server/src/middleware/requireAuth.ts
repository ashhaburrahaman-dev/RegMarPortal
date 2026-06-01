import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyJWT } from '../lib/jwt.js'
import type { JWTPayload } from '../lib/jwt.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies['auth_token']

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  try {
    request.user = verifyJWT(token)
  } catch {
    return reply.status(401).send({ error: 'Session expired. Please log in again.' })
  }
}
