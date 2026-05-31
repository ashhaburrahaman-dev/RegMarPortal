export const PDF_COORDS = {
  memoNumber: { x: 400, y: 800, size: 11 },
  marriageDate: { x: 120, y: 750, size: 11 },
  registrationDate: { x: 350, y: 750, size: 11 },
  regBookNo: { x: 120, y: 720, size: 11 },
  pageNo: { x: 280, y: 720, size: 11 },
  regYear: { x: 400, y: 720, size: 11 },

  groomName: { x: 120, y: 660, size: 12 },
  groomFatherName: { x: 120, y: 642, size: 10 },
  groomAddress: { x: 120, y: 624, size: 10 },

  brideName: { x: 120, y: 570, size: 12 },
  brideFatherName: { x: 120, y: 552, size: 10 },
  brideAddress: { x: 120, y: 534, size: 10 },

  wakilName: { x: 120, y: 480, size: 11 },
  wakilFatherName: { x: 120, y: 462, size: 10 },
  wakilAddress: { x: 120, y: 444, size: 10 },

  witness1Name: { x: 120, y: 390, size: 11 },
  witness1FatherName: { x: 120, y: 372, size: 10 },
  witness1Address: { x: 120, y: 354, size: 10 },

  witness2Name: { x: 340, y: 390, size: 11 },
  witness2FatherName: { x: 340, y: 372, size: 10 },
  witness2Address: { x: 340, y: 354, size: 10 },

  dowerAmount: { x: 120, y: 300, size: 11 },
  paymentMethod: { x: 300, y: 300, size: 11 },
  promptAmount: { x: 120, y: 282, size: 11 },
  deferredAmount: { x: 300, y: 282, size: 11 },
} as const

export type PdfCoordKey = keyof typeof PDF_COORDS
