import { Hono } from 'hono'
import { requireAuth } from '../middleware/requireAuth.js'
import { PDF_COORDS } from '../config/pdfCoordinates.js'
import type { Env } from '../types.js'

const certificate = new Hono<{ Bindings: Env }>()

certificate.use('*', requireAuth)

const COORDS_KV_KEY = 'certificate:coords:v1'

// ─── GET /api/v1/certificate/bg ──────────────────────────────────────────────
// Serves the certificate background PNG from R2 for the designer preview
certificate.get('/bg', async (c) => {
  const obj = await c.env.ASSETS.get('certificate-bg.png')
  if (!obj) {
    return c.json({ error: 'Certificate background not found in R2' }, 404)
  }
  const bytes = await obj.arrayBuffer()
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})

// ─── GET /api/v1/certificate/coords ──────────────────────────────────────────
// Returns the current field coordinates (from KV or hardcoded defaults)
certificate.get('/coords', async (c) => {
  const cached = await c.env.PINCODE_CACHE.get(COORDS_KV_KEY)
  if (cached) {
    try {
      return c.json(JSON.parse(cached))
    } catch {
      // Fall through to defaults
    }
  }
  return c.json(PDF_COORDS)
})

// ─── PUT /api/v1/certificate/coords ──────────────────────────────────────────
// Saves updated field coordinates to KV (admin only)
certificate.put('/coords', async (c) => {
  const user = c.get('user' as never) as { role: string } | undefined
  if (!user || (user as { role: string }).role !== 'ADMIN') {
    return c.json({ error: 'Admin access required' }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (typeof body !== 'object' || body === null) {
    return c.json({ error: 'Invalid coordinates object' }, 400)
  }

  await c.env.PINCODE_CACHE.put(COORDS_KV_KEY, JSON.stringify(body))
  return c.json({ success: true })
})

// ─── DELETE /api/v1/certificate/coords ───────────────────────────────────────
// Resets to hardcoded defaults by removing KV entry
certificate.delete('/coords', async (c) => {
  const user = c.get('user' as never) as { role: string } | undefined
  if (!user || (user as { role: string }).role !== 'ADMIN') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await c.env.PINCODE_CACHE.delete(COORDS_KV_KEY)
  return c.json({ success: true, message: 'Reset to defaults' })
})

export default certificate
