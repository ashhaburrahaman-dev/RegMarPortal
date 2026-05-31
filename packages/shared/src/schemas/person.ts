import { z } from 'zod'

export const PersonRoleEnum = z.enum(['GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2'])
export type PersonRole = z.infer<typeof PersonRoleEnum>

export const PersonSchema = z.object({
  role: PersonRoleEnum,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  fatherName: z.string().max(100).optional(),
  pincode: z
    .string()
    .length(6, 'Pincode must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Pincode must contain only digits')
    .optional()
    .or(z.literal('')),
  postOffice: z.string().max(100).optional(),
  stateName: z.string().max(100).optional(),
  districtName: z.string().max(100).optional(),
  policeStation: z.string().max(100).optional(),
  villageCity: z.string().max(150).optional(),
})

export type Person = z.infer<typeof PersonSchema>
