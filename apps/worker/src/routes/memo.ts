import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/requireAuth.js'
import { getDb } from '../db/client.js'
import { marriages } from '../db/schema.js'
import type { Env } from '../types.js'

const memo = new Hono<{ Bindings: Env }>()

memo.use('*', requireAuth)

// ─── GET /api/v1/memo/validate?memo=45A/44/2026 ───────────────────────────────
memo.get(
  '/validate',
  zValidator(
    'query',
    z.object({
      memo: z.string().min(1, 'Memo number is required'),
      excludeId: z.string().uuid().optional(), // Exclude current record on edit
    })
  ),
  async (c) => {
    const { memo: memoNumber, excludeId } = c.req.valid('query')
    const db = getDb(c.env.DB)

    const [existing] = await db
      .select({ id: marriages.id })
      .from(marriages)
      .where(eq(marriages.memoNumber, memoNumber))
      .limit(1)

    // If editing (excludeId provided), it's OK if the found record is the current one
    const exists = existing !== undefined && existing.id !== excludeId

    return c.json({ exists })
  }
)

export default memo
