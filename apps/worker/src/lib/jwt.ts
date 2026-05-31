import { SignJWT, jwtVerify } from 'jose'

export interface JwtPayload {
  sub: string
  role: 'ADMIN' | 'OPERATOR'
  username: string
}

/**
 * Signs a JWT using HS256 (Web Crypto API — Workers-compatible).
 */
export async function signJWT(
  payload: JwtPayload,
  secret: string,
  expiresIn: string = '8h'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey)
  return token
}

/**
 * Verifies and decodes a JWT. Throws if invalid or expired.
 */
export async function verifyJWT(token: string, secret: string): Promise<JwtPayload> {
  const secretKey = new TextEncoder().encode(secret)
  const { payload } = await jwtVerify(token, secretKey, {
    algorithms: ['HS256'],
  })

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.role !== 'string' ||
    (payload.role !== 'ADMIN' && payload.role !== 'OPERATOR') ||
    typeof payload.username !== 'string'
  ) {
    throw new Error('Invalid JWT payload structure')
  }

  return {
    sub: payload.sub,
    role: payload.role as 'ADMIN' | 'OPERATOR',
    username: payload.username,
  }
}
