import type { FastifyInstance } from 'fastify'
import { LoginSchema } from '@regmar/shared'
import { comparePassword } from '../lib/password.js'
import { signJWT } from '../lib/jwt.js'
import { generateCsrfToken } from '../lib/csrf.js'
import { requireAuth } from '../middleware/requireAuth.js'

const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const MAX_FAILED_ATTEMPTS = 5
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours in seconds

export default async function authRoutes(app: FastifyInstance) {
  // POST /login
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const result = LoginSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid input', details: result.error.flatten() })
    }

    const { username, password } = result.data
    const ipAddress = request.ip

    // Find user
    const user = await app.prisma.user.findUnique({ where: { username } })

    if (!user) {
      // Log failed attempt without userId
      await app.prisma.loginLog.create({
        data: { username, ipAddress, loginStatus: 'FAILED' },
      })
      return reply.status(401).send({ error: 'Invalid username or password' })
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await app.prisma.loginLog.create({
        data: { userId: user.id, username, ipAddress, loginStatus: 'LOCKED' },
      })
      const remainingMs = user.lockedUntil.getTime() - Date.now()
      const remainingMin = Math.ceil(remainingMs / 60000)
      return reply.status(423).send({
        error: `Account locked. Try again in ${remainingMin} minute(s).`,
      })
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      const newFailedAttempts = user.failedAttempts + 1
      const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS

      await app.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newFailedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      })

      await app.prisma.loginLog.create({
        data: { userId: user.id, username, ipAddress, loginStatus: 'FAILED' },
      })

      if (shouldLock) {
        return reply.status(423).send({
          error: 'Too many failed attempts. Account locked for 15 minutes.',
        })
      }

      const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts
      return reply.status(401).send({
        error: `Invalid username or password. ${remaining} attempt(s) remaining.`,
      })
    }

    // Success — reset counters
    await app.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    })

    await app.prisma.loginLog.create({
      data: { userId: user.id, username, ipAddress, loginStatus: 'SUCCESS' },
    })

    const token = signJWT({ sub: user.id, username: user.username, role: user.role })
    const csrfToken = generateCsrfToken()

    reply.setCookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false, // set true when behind HTTPS in production
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })

    reply.setCookie('csrf_token', csrfToken, {
      httpOnly: false, // must be readable by JS for X-CSRF-Token header
      sameSite: 'strict',
      secure: false,
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })

    return reply.send({
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        username: user.username,
      },
    })
  })

  // POST /logout
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('auth_token', { path: '/' })
    reply.clearCookie('csrf_token', { path: '/' })
    return reply.send({ success: true })
  })

  // GET /me
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        fullName: true,
        role: true,
        username: true,
        lastLogin: true,
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return reply.send(user)
  })

  // GET /users/count (admin only — for dashboard stat)
  app.get('/users/count', { preHandler: [requireAuth] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    const count = await app.prisma.user.count()
    return reply.send({ count })
  })
}
