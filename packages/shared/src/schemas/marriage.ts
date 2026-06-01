import { z } from 'zod'
import { PersonSchema } from './person.js'

export const PaymentMethodEnum = z.enum(['CASH', 'DEFERRED'])

export const MarriageCreateSchema = z
  .object({
    regBookNo: z.string().min(1).max(20),
    pageNo: z.string().min(1).max(10),
    regYear: z.number().int().min(1900).max(2100),
    memoNumber: z.string().min(3).max(50),
    marriageDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    dowerAmount: z.number().positive('Dower amount must be positive'),
    paymentMethod: PaymentMethodEnum,
    deferredAmount: z.number().min(0),
    promptAmount: z.number().min(0),
    persons: z.array(PersonSchema).length(5, 'Exactly 5 persons required'),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'CASH') {
      if (Math.abs(data.promptAmount - data.dowerAmount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt amount must equal dower amount for CASH payment',
          path: ['promptAmount'],
        })
      }
      if (Math.abs(data.deferredAmount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deferred amount must be 0 for CASH payment',
          path: ['deferredAmount'],
        })
      }
    }

    if (data.paymentMethod === 'DEFERRED') {
      if (data.deferredAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deferred amount must be greater than 0',
          path: ['deferredAmount'],
        })
      }
      if (data.deferredAmount >= data.dowerAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deferred amount must be less than dower amount',
          path: ['deferredAmount'],
        })
      }
      const expected = data.dowerAmount - data.deferredAmount
      if (Math.abs(data.promptAmount - expected) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt amount must equal dower minus deferred amount',
          path: ['promptAmount'],
        })
      }
    }
  })

export const MarriageUpdateSchema = MarriageCreateSchema.partial().extend({
  persons: z.array(PersonSchema).length(5).optional(),
})

export type MarriageCreate = z.infer<typeof MarriageCreateSchema>
export type MarriageUpdate = z.infer<typeof MarriageUpdateSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>
