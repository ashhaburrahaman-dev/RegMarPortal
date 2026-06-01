import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface JWTPayload {
  sub: string
  username: string
  role: 'ADMIN' | 'OPERATOR'
  iat?: number
  exp?: number
}

export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  })
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload
}
