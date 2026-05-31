import { z } from 'zod'

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
})

export type LoginInput = z.infer<typeof LoginSchema>
