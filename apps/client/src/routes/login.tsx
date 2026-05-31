import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { LoginSchema } from '@regmar/shared'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoginInput } from '@/types'
import type { ApiUser } from '@/types'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // If already logged in, redirect to dashboard
    try {
      await api.get('/auth/me')
      throw redirect({ to: '/dashboard' })
    } catch (err) {
      if (err instanceof Response || (err as { isRedirect?: boolean }).isRedirect) throw err
      // Not logged in — show login page
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) =>
      api.post<{ user: ApiUser }>('/auth/login', data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['auth', 'me'], { user: data.user })
      toast.success(`Welcome back, ${data.user.fullName}!`)
      await navigate({ to: '/dashboard' })
    },
    onError: (err) => {
      if (err instanceof Error) {
        if (err.message.includes('locked') || ('status' in err && (err as { status: number }).status === 423)) {
          toast.error('Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.')
        } else {
          toast.error('Invalid username or password')
        }
      }
    },
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-background to-purple-950/20 pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25 mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Marriage Registry</h1>
          <p className="text-zinc-500 text-sm mt-1">Muhammadan Marriage Registration Office</p>
          <p className="text-zinc-600 text-xs mt-1">Authorised staff only</p>
        </div>

        {/* Login card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                autoComplete="username"
                placeholder="Enter your username"
                {...register('username')}
                autoFocus
              />
              {errors.username && (
                <p className="text-xs text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              id="login-submit-btn"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Private system — unauthorised access is prohibited
        </p>
      </div>
    </div>
  )
}
