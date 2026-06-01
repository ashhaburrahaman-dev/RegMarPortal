import { z } from 'zod'

export const PersonRoleEnum = z.enum(['GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2'])

export const PersonSchema = z.object({
  role: PersonRoleEnum,
  fullName: z.string().min(2).max(100),
  fatherName: z.string().max(100).optional(),
  pincode: z.string().length(6).regex(/^\d{6}$/).optional().or(z.literal('')),
  postOffice: z.string().max(100).optional(),
  stateName: z.string().max(100).optional(),
  districtName: z.string().max(100).optional(),
  policeStation: z.string().max(100).optional(),
  villageCity: z.string().max(150).optional(),
})

export type PersonInput = z.infer<typeof PersonSchema>
export type PersonRole = z.infer<typeof PersonRoleEnum>
