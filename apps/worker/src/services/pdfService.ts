import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { PDF_COORDS } from '../config/pdfCoordinates.js'
import type { Marriage, Person } from '../db/schema.js'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

export type CoordsMap = Record<string, { x: number; y: number; size: number }>

/**
 * Formats a person's address as a single readable line.
 */
function formatAddress(p: Person): string {
  const parts = [p.villageCity, p.policeStation, p.districtName, p.stateName, p.pincode].filter(
    Boolean
  )
  return parts.join(', ')
}

/**
 * Wraps text to a maximum of `maxChars` per line.
 */
function wrapText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current.trim())
  return lines.join('\n')
}

/**
 * Generates a marriage certificate PDF using pdf-lib.
 * Background image is fetched from R2.
 * Accepts dynamic `coords` map so the Certificate Designer can update field positions
 * without a code change — defaults to the hardcoded PDF_COORDS if not provided.
 */
export async function generateCertificatePdf(
  marriage: Marriage,
  personsList: Person[],
  bgImageBytes: ArrayBuffer,
  coords: CoordsMap = PDF_COORDS as unknown as CoordsMap
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])

  // Embed and draw background image
  const bgImage = await pdfDoc.embedPng(bgImageBytes)
  page.drawImage(bgImage, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT })

  // Embed Helvetica for all text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const drawText = (text: string, x: number, y: number, size: number, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.1),
    })
  }

  // Helper: get coords for a field key
  const co = (key: string) => coords[key] ?? { x: 0, y: 0, size: 10 }

  // Helper to find person by role
  const byRole = (role: string) => personsList.find((p) => p.role === role)

  const groom = byRole('GROOM')
  const bride = byRole('BRIDE')
  const wakil = byRole('WAKIL')
  const witness1 = byRole('WITNESS1')
  const witness2 = byRole('WITNESS2')

  // ── Header fields ─────────────────────────────────────────────────────────
  const mn = co('memoNumber')
  drawText(marriage.memoNumber, mn.x, mn.y, mn.size, true)

  const md = co('marriageDate')
  drawText(marriage.marriageDate, md.x, md.y, md.size)

  const rd = co('registrationDate')
  drawText(marriage.registrationDate, rd.x, rd.y, rd.size)

  const rb = co('regBookNo')
  drawText(marriage.regBookNo, rb.x, rb.y, rb.size)

  const pn = co('pageNo')
  drawText(marriage.pageNo, pn.x, pn.y, pn.size)

  const ry = co('regYear')
  drawText(String(marriage.regYear), ry.x, ry.y, ry.size)

  // ── Groom ─────────────────────────────────────────────────────────────────
  if (groom) {
    const gn = co('groomName')
    drawText(groom.fullName, gn.x, gn.y, gn.size, true)
    if (groom.fatherName) {
      const gf = co('groomFatherName')
      drawText(`S/O: ${groom.fatherName}`, gf.x, gf.y, gf.size)
    }
    const ga = co('groomAddress')
    drawText(wrapText(formatAddress(groom), 70), ga.x, ga.y, ga.size)
  }

  // ── Bride ─────────────────────────────────────────────────────────────────
  if (bride) {
    const bn = co('brideName')
    drawText(bride.fullName, bn.x, bn.y, bn.size, true)
    if (bride.fatherName) {
      const bf = co('brideFatherName')
      drawText(`D/O: ${bride.fatherName}`, bf.x, bf.y, bf.size)
    }
    const ba = co('brideAddress')
    drawText(wrapText(formatAddress(bride), 70), ba.x, ba.y, ba.size)
  }

  // ── Wakil ─────────────────────────────────────────────────────────────────
  if (wakil) {
    const wn = co('wakilName')
    drawText(wakil.fullName, wn.x, wn.y, wn.size)
    if (wakil.fatherName) {
      const wf = co('wakilFatherName')
      drawText(`S/O: ${wakil.fatherName}`, wf.x, wf.y, wf.size)
    }
    const wa = co('wakilAddress')
    drawText(wrapText(formatAddress(wakil), 70), wa.x, wa.y, wa.size)
  }

  // ── Witness 1 ─────────────────────────────────────────────────────────────
  if (witness1) {
    const w1n = co('witness1Name')
    drawText(witness1.fullName, w1n.x, w1n.y, w1n.size)
    if (witness1.fatherName) {
      const w1f = co('witness1FatherName')
      drawText(`S/O: ${witness1.fatherName}`, w1f.x, w1f.y, w1f.size)
    }
    const w1a = co('witness1Address')
    drawText(wrapText(formatAddress(witness1), 35), w1a.x, w1a.y, w1a.size)
  }

  // ── Witness 2 ─────────────────────────────────────────────────────────────
  if (witness2) {
    const w2n = co('witness2Name')
    drawText(witness2.fullName, w2n.x, w2n.y, w2n.size)
    if (witness2.fatherName) {
      const w2f = co('witness2FatherName')
      drawText(`S/O: ${witness2.fatherName}`, w2f.x, w2f.y, w2f.size)
    }
    const w2a = co('witness2Address')
    drawText(wrapText(formatAddress(witness2), 35), w2a.x, w2a.y, w2a.size)
  }

  // ── Financial details ─────────────────────────────────────────────────────
  const da = co('dowerAmount')
  drawText(`₹ ${marriage.dowerAmount.toLocaleString('en-IN')}`, da.x, da.y, da.size)

  const pm = co('paymentMethod')
  drawText(marriage.paymentMethod, pm.x, pm.y, pm.size)

  const pa = co('promptAmount')
  drawText(`₹ ${marriage.promptAmount.toLocaleString('en-IN')}`, pa.x, pa.y, pa.size)

  const dfa = co('deferredAmount')
  drawText(`₹ ${marriage.deferredAmount.toLocaleString('en-IN')}`, dfa.x, dfa.y, dfa.size)

  return pdfDoc.save()
}
