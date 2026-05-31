import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { users, loginLogs } from '../db/schema.js'
import { signJWT } from '../lib/jwt.js'
import { comparePassword } from '../lib/password.js'
import { generateCsrfToken } from '../lib/csrf.js'
import type { Env } from '../types.js'

const LOCKOUT_THRESHOLD = 5
const LOCKOUT_DURATION_SECONDS = 900 // 15 minutes

export interface LoginResult {
  success: true
  userId: string
  fullName: string
  role: string
  token: string
  csrfToken: string
}

export interface LoginError {
  success: false
  code: 'USER_NOT_FOUND' | 'LOCKED' | 'WRONG_PASSWORD'
  lockedUntil?: number
}

export async function attemptLogin(
  env: Env,
  username: string,
  password: string,
  ipAddress: string | null
): Promise<LoginResult | LoginError> {
  const db = getDb(env.DB)
  const now = Math.floor(Date.now() / 1000)

  // 1. Find user
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

  if (!user) {
    // Log failed attempt (no userId since user doesn't exist)
    await db.insert(loginLogs).values({
      username,
      ipAddress,
      loginStatus: 'FAILED',
    })
    return { success: false, code: 'USER_NOT_FOUND' }
  }

  // 2. Check lockout
  if (user.lockedUntil && user.lockedUntil > now) {
    await db.insert(loginLogs).values({
      userId: user.id,
      username,
      ipAddress,
      loginStatus: 'LOCKED',
    })
    return { success: false, code: 'LOCKED', lockedUntil: user.lockedUntil }
  }

  // 3. Check password
  const passwordMatch = await comparePassword(password, user.passwordHash)

  if (!passwordMatch) {
    const newFailedAttempts = (user.failedAttempts ?? 0) + 1
    const shouldLock = newFailedAttempts >= LOCKOUT_THRESHOLD

    await db
      .update(users)
      .set({
        failedAttempts: newFailedAttempts,
        lockedUntil: shouldLock ? now + LOCKOUT_DURATION_SECONDS : null,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))

    await db.insert(loginLogs).values({
      userId: user.id,
      username,
      ipAddress,
      loginStatus: 'FAILED',
    })

    return { success: false, code: 'WRONG_PASSWORD' }
  }

  // 4. Successful login — reset failed attempts
  await db
    .update(users)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: now,
      updatedAt: now,
    })
    .where(eq(users.id, user.id))

  await db.insert(loginLogs).values({
    userId: user.id,
    username,
    ipAddress,
    loginStatus: 'SUCCESS',
  })

  // 5. Issue JWT + CSRF token
  const token = await signJWT(
    { sub: user.id, role: user.role, username: user.username },
    env.JWT_SECRET,
    '8h'
  )
  const csrfToken = generateCsrfToken()

  return {
    success: true,
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    token,
    csrfToken,
  }
}
