import { Hono } from 'hono'
import { requireAuth } from '../middleware/requireAuth.js'
import { getMarriageById } from '../services/marriageService.js'
import { generateCertificatePdf } from '../services/pdfService.js'
import type { Env } from '../types.js'

const pdf = new Hono<{ Bindings: Env }>()

pdf.use('*', requireAuth)

// ─── GET /api/v1/pdf/:id ──────────────────────────────────────────────────────
pdf.get('/:id', async (c) => {
  const id = c.req.param('id')

  // 1. Fetch marriage + persons
  const marriage = await getMarriageById(c.env, id)
  if (!marriage) {
    return c.json({ error: 'Marriage record not found' }, 404)
  }

  // 2. Fetch background image from R2
  const r2Object = await c.env.ASSETS.get('certificate-bg.png')
  if (!r2Object) {
    return c.json(
      { error: 'Certificate background image not found in R2. Please upload certificate-bg.png.' },
      500
    )
  }
  const bgImageBytes = await r2Object.arrayBuffer()

  // 3. Generate PDF
  const pdfBytes = await generateCertificatePdf(marriage, marriage.persons, bgImageBytes)

  // 4. Return as downloadable PDF
  const safeFilename = marriage.memoNumber.replace(/[^a-zA-Z0-9\-_]/g, '-')
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cert-${safeFilename}.pdf"`,
      'Content-Length': String(pdfBytes.byteLength),
      'Cache-Control': 'no-store',
    },
  })
})

export default pdf
