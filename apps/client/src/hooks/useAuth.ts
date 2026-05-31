import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiUser } from '@/types'

const AUTH_QUERY_KEY = ['auth', 'me'] as const

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => api.get<{ user: ApiUser }>('/auth/me'),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  }
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout', {}),
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })
}
