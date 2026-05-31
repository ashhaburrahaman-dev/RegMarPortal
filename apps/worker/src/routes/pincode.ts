import { Hono } from 'hono'
import { requireAuth } from '../middleware/requireAuth.js'
import { lookupPincode } from '../services/pincodeService.js'
import type { Env } from '../types.js'

const pincode = new Hono<{ Bindings: Env }>()

pincode.use('*', requireAuth)

// ─── GET /api/v1/pincode/:pincode ─────────────────────────────────────────────
pincode.get('/:pincode', async (c) => {
  const pin = c.req.param('pincode')

  if (!/^\d{6}$/.test(pin)) {
    return c.json({ error: 'Invalid pincode format. Must be exactly 6 digits.' }, 400)
  }

  const result = await lookupPincode(c.env, pin)

  if (!result) {
    return c.json(null, 200)
  }

  return c.json(result)
})

export default pincode
