export interface PdfCoord {
  x: number
  y: number
  size: number
  bold?: boolean
  maxWidth?: number
}

export const PDF_COORDS: Record<string, PdfCoord> = {
  memoNumber:         { x: 400, y: 800, size: 11, bold: true },
  marriageDate:       { x: 120, y: 750, size: 11 },
  registrationDate:   { x: 350, y: 750, size: 11 },
  regBookNo:          { x: 120, y: 720, size: 11 },
  pageNo:             { x: 280, y: 720, size: 11 },
  regYear:            { x: 400, y: 720, size: 11 },

  groomName:          { x: 120, y: 660, size: 12, bold: true, maxWidth: 250 },
  groomFatherName:    { x: 120, y: 642, size: 10, maxWidth: 250 },
  groomAddress:       { x: 120, y: 624, size: 10, maxWidth: 350 },

  brideName:          { x: 120, y: 570, size: 12, bold: true, maxWidth: 250 },
  brideFatherName:    { x: 120, y: 552, size: 10, maxWidth: 250 },
  brideAddress:       { x: 120, y: 534, size: 10, maxWidth: 350 },

  wakilName:          { x: 120, y: 480, size: 11, maxWidth: 250 },
  wakilFatherName:    { x: 120, y: 462, size: 10, maxWidth: 250 },
  wakilAddress:       { x: 120, y: 444, size: 10, maxWidth: 350 },

  witness1Name:       { x: 120, y: 390, size: 11, maxWidth: 200 },
  witness1FatherName: { x: 120, y: 372, size: 10, maxWidth: 200 },
  witness1Address:    { x: 120, y: 354, size: 10, maxWidth: 200 },

  witness2Name:       { x: 340, y: 390, size: 11, maxWidth: 200 },
  witness2FatherName: { x: 340, y: 372, size: 10, maxWidth: 200 },
  witness2Address:    { x: 340, y: 354, size: 10, maxWidth: 200 },

  dowerAmount:        { x: 120, y: 300, size: 11 },
  paymentMethod:      { x: 300, y: 300, size: 11 },
  promptAmount:       { x: 120, y: 282, size: 11 },
  deferredAmount:     { x: 300, y: 282, size: 11 },
}
