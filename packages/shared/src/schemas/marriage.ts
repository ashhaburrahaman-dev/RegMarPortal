import { z } from 'zod'
import { PersonSchema } from './person.js'

export const MarriageCreateSchema = z
  .object({
    regBookNo: z.string().min(1, 'Registration book number is required').max(20),
    pageNo: z.string().min(1, 'Page number is required').max(10),
    regYear: z
      .number()
      .int()
      .min(1900, 'Year must be after 1900')
      .max(2100, 'Year must be before 2100'),
    memoNumber: z.string().min(3, 'Memo number is required').max(50),
    marriageDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Marriage date must be in YYYY-MM-DD format'),
    registrationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Registration date must be in YYYY-MM-DD format'),
    dowerAmount: z.number().positive('Dower amount must be positive'),
    paymentMethod: z.enum(['CASH', 'DEFERRED']),
    deferredAmount: z.number().min(0, 'Deferred amount cannot be negative'),
    promptAmount: z.number().min(0, 'Prompt amount cannot be negative'),
    persons: z.array(PersonSchema).length(5, 'Exactly 5 persons are required'),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'DEFERRED') {
      if (data.promptAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt amount must be greater than 0',
          path: ['promptAmount'],
        })
      }
      if (data.promptAmount >= data.dowerAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt amount must be less than the total dower amount',
          path: ['promptAmount'],
        })
      }
      const expected = data.dowerAmount - data.promptAmount
      if (Math.abs(data.deferredAmount - expected) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deferred amount must equal dower amount minus prompt amount',
          path: ['deferredAmount'],
        })
      }
    }
    if (data.paymentMethod === 'CASH') {
      if (Math.abs(data.promptAmount - data.dowerAmount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt amount must equal dower amount for cash payment',
          path: ['promptAmount'],
        })
      }
      if (Math.abs(data.deferredAmount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deferred amount must be 0 for cash payment',
          path: ['deferredAmount'],
        })
      }
    }
  })

export const MarriageUpdateSchema = MarriageCreateSchema

export type MarriageCreate = z.infer<typeof MarriageCreateSchema>
export type MarriageUpdate = z.infer<typeof MarriageUpdateSchema>
