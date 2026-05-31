import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.js'

/**
 * Factory function that creates a drizzle D1 client.
 * Call this inside each request handler using `c.env.DB`.
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type DbClient = ReturnType<typeof getDb>
