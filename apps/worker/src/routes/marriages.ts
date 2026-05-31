import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { MarriageCreateSchema } from '@regmar/shared'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import { csrfProtect } from '../middleware/csrfProtect.js'
import {
  listMarriages,
  getMarriageById,
  createMarriage,
  updateMarriage,
  deleteMarriage,
  searchMarriages,
} from '../services/marriageService.js'
import type { Env } from '../types.js'

const marriages = new Hono<{ Bindings: Env }>()

// All routes require authentication and CSRF protection
marriages.use('*', requireAuth, csrfProtect)

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['marriageDate', 'memoNumber']).default('marriageDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// ─── GET /api/v1/marriages (paginated list) ───────────────────────────────────
marriages.get('/', zValidator('query', paginationSchema), async (c) => {
  const query = c.req.valid('query')
  const result = await listMarriages(c.env, {
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    order: query.order,
    ...(query.year !== undefined ? { year: query.year } : {}),
    ...(query.search !== undefined ? { search: query.search } : {}),
  })
  return c.json(result)
})

// ─── GET /api/v1/marriages/search ─────────────────────────────────────────────
marriages.get(
  '/search',
  zValidator(
    'query',
    z.object({
      memo: z.string().optional(),
      groom: z.string().optional(),
      bride: z.string().optional(),
      year: z.coerce.number().int().optional(),
    })
  ),
  async (c) => {
    const query = c.req.valid('query')
    const results = await searchMarriages(c.env, {
      ...(query.memo !== undefined ? { memo: query.memo } : {}),
      ...(query.groom !== undefined ? { groom: query.groom } : {}),
      ...(query.bride !== undefined ? { bride: query.bride } : {}),
      ...(query.year !== undefined ? { year: query.year } : {}),
    })
    return c.json({ data: results })
  }
)

// ─── GET /api/v1/marriages/:id ─────────────────────────────────────────────────
marriages.get('/:id', async (c) => {
  const id = c.req.param('id')
  const marriage = await getMarriageById(c.env, id)

  if (!marriage) {
    return c.json({ error: 'Marriage record not found' }, 404)
  }

  return c.json(marriage)
})

// ─── POST /api/v1/marriages ────────────────────────────────────────────────────
marriages.post(
  '/',
  requireRole(['ADMIN', 'OPERATOR']),
  zValidator('json', MarriageCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')

    try {
      const result = await createMarriage(c.env, data, user.sub)
      return c.json(result, 201)
    } catch (err) {
      // Handle unique constraint violation on memo_number
      if (err instanceof Error && err.message.includes('UNIQUE')) {
        return c.json({ error: 'A record with this memo number already exists' }, 409)
      }
      throw err
    }
  }
)

// ─── PUT /api/v1/marriages/:id ────────────────────────────────────────────────
marriages.put(
  '/:id',
  requireRole(['ADMIN', 'OPERATOR']),
  zValidator('json', MarriageCreateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    const existing = await getMarriageById(c.env, id)
    if (!existing) {
      return c.json({ error: 'Marriage record not found' }, 404)
    }

    const updated = await updateMarriage(c.env, id, data)
    return c.json(updated)
  }
)

// ─── DELETE /api/v1/marriages/:id ─────────────────────────────────────────────
marriages.delete('/:id', requireRole(['ADMIN']), async (c) => {
  const id = c.req.param('id')

  const existing = await getMarriageById(c.env, id)
  if (!existing) {
    return c.json({ error: 'Marriage record not found' }, 404)
  }

  await deleteMarriage(c.env, id)
  return new Response(null, { status: 204 })
})

export default marriages
