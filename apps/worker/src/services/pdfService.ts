import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { PDF_COORDS } from '../config/pdfCoordinates.js'
import type { Marriage, Person } from '../db/schema.js'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

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
 */
export async function generateCertificatePdf(
  marriage: Marriage,
  personsList: Person[],
  bgImageBytes: ArrayBuffer
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

  // Helper to find person by role
  const byRole = (role: string) => personsList.find((p) => p.role === role)

  const groom = byRole('GROOM')
  const bride = byRole('BRIDE')
  const wakil = byRole('WAKIL')
  const witness1 = byRole('WITNESS1')
  const witness2 = byRole('WITNESS2')

  // ── Header fields ─────────────────────────────────────────────────────────
  drawText(marriage.memoNumber, PDF_COORDS.memoNumber.x, PDF_COORDS.memoNumber.y, PDF_COORDS.memoNumber.size, true)
  drawText(marriage.marriageDate, PDF_COORDS.marriageDate.x, PDF_COORDS.marriageDate.y, PDF_COORDS.marriageDate.size)
  drawText(marriage.registrationDate, PDF_COORDS.registrationDate.x, PDF_COORDS.registrationDate.y, PDF_COORDS.registrationDate.size)
  drawText(marriage.regBookNo, PDF_COORDS.regBookNo.x, PDF_COORDS.regBookNo.y, PDF_COORDS.regBookNo.size)
  drawText(marriage.pageNo, PDF_COORDS.pageNo.x, PDF_COORDS.pageNo.y, PDF_COORDS.pageNo.size)
  drawText(String(marriage.regYear), PDF_COORDS.regYear.x, PDF_COORDS.regYear.y, PDF_COORDS.regYear.size)

  // ── Groom ─────────────────────────────────────────────────────────────────
  if (groom) {
    drawText(groom.fullName, PDF_COORDS.groomName.x, PDF_COORDS.groomName.y, PDF_COORDS.groomName.size, true)
    if (groom.fatherName) {
      drawText(`S/O: ${groom.fatherName}`, PDF_COORDS.groomFatherName.x, PDF_COORDS.groomFatherName.y, PDF_COORDS.groomFatherName.size)
    }
    drawText(wrapText(formatAddress(groom), 70), PDF_COORDS.groomAddress.x, PDF_COORDS.groomAddress.y, PDF_COORDS.groomAddress.size)
  }

  // ── Bride ─────────────────────────────────────────────────────────────────
  if (bride) {
    drawText(bride.fullName, PDF_COORDS.brideName.x, PDF_COORDS.brideName.y, PDF_COORDS.brideName.size, true)
    if (bride.fatherName) {
      drawText(`D/O: ${bride.fatherName}`, PDF_COORDS.brideFatherName.x, PDF_COORDS.brideFatherName.y, PDF_COORDS.brideFatherName.size)
    }
    drawText(wrapText(formatAddress(bride), 70), PDF_COORDS.brideAddress.x, PDF_COORDS.brideAddress.y, PDF_COORDS.brideAddress.size)
  }

  // ── Wakil ─────────────────────────────────────────────────────────────────
  if (wakil) {
    drawText(wakil.fullName, PDF_COORDS.wakilName.x, PDF_COORDS.wakilName.y, PDF_COORDS.wakilName.size)
    if (wakil.fatherName) {
      drawText(`S/O: ${wakil.fatherName}`, PDF_COORDS.wakilFatherName.x, PDF_COORDS.wakilFatherName.y, PDF_COORDS.wakilFatherName.size)
    }
    drawText(wrapText(formatAddress(wakil), 70), PDF_COORDS.wakilAddress.x, PDF_COORDS.wakilAddress.y, PDF_COORDS.wakilAddress.size)
  }

  // ── Witness 1 ─────────────────────────────────────────────────────────────
  if (witness1) {
    drawText(witness1.fullName, PDF_COORDS.witness1Name.x, PDF_COORDS.witness1Name.y, PDF_COORDS.witness1Name.size)
    if (witness1.fatherName) {
      drawText(`S/O: ${witness1.fatherName}`, PDF_COORDS.witness1FatherName.x, PDF_COORDS.witness1FatherName.y, PDF_COORDS.witness1FatherName.size)
    }
    drawText(wrapText(formatAddress(witness1), 35), PDF_COORDS.witness1Address.x, PDF_COORDS.witness1Address.y, PDF_COORDS.witness1Address.size)
  }

  // ── Witness 2 ─────────────────────────────────────────────────────────────
  if (witness2) {
    drawText(witness2.fullName, PDF_COORDS.witness2Name.x, PDF_COORDS.witness2Name.y, PDF_COORDS.witness2Name.size)
    if (witness2.fatherName) {
      drawText(`S/O: ${witness2.fatherName}`, PDF_COORDS.witness2FatherName.x, PDF_COORDS.witness2FatherName.y, PDF_COORDS.witness2FatherName.size)
    }
    drawText(wrapText(formatAddress(witness2), 35), PDF_COORDS.witness2Address.x, PDF_COORDS.witness2Address.y, PDF_COORDS.witness2Address.size)
  }

  // ── Financial details ─────────────────────────────────────────────────────
  drawText(`₹ ${marriage.dowerAmount.toLocaleString('en-IN')}`, PDF_COORDS.dowerAmount.x, PDF_COORDS.dowerAmount.y, PDF_COORDS.dowerAmount.size)
  drawText(marriage.paymentMethod, PDF_COORDS.paymentMethod.x, PDF_COORDS.paymentMethod.y, PDF_COORDS.paymentMethod.size)
  drawText(`₹ ${marriage.promptAmount.toLocaleString('en-IN')}`, PDF_COORDS.promptAmount.x, PDF_COORDS.promptAmount.y, PDF_COORDS.promptAmount.size)
  drawText(`₹ ${marriage.deferredAmount.toLocaleString('en-IN')}`, PDF_COORDS.deferredAmount.x, PDF_COORDS.deferredAmount.y, PDF_COORDS.deferredAmount.size)

  return pdfDoc.save()
}
