/**
 * Cloudflare Worker environment bindings and shared types.
 */

export type Env = {
  DB: D1Database
  ASSETS: R2Bucket
  PINCODE_CACHE: KVNamespace
  JWT_SECRET: string
  ALLOWED_ORIGIN: string
  ENVIRONMENT: string
}

export type UserContext = {
  sub: string
  role: 'ADMIN' | 'OPERATOR'
  username: string
}

export type PaginationQuery = {
  page?: string
  limit?: string
  year?: string
  search?: string
  sortBy?: string
  order?: string
}
