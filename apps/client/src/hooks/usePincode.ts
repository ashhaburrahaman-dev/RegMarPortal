import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { PincodeResult } from '@/types'

/**
 * Fetches pincode data from the Worker proxy (KV-cached).
 * Only fires when pincode is exactly 6 digits.
 */
export function usePincode(pincode: string | undefined) {
  const isValid = typeof pincode === 'string' && /^\d{6}$/.test(pincode)

  return useQuery({
    queryKey: ['pincode', pincode],
    queryFn: () => api.get<PincodeResult>(`/pincode/${pincode}`),
    enabled: isValid,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — KV caches for 7 days
    retry: (failureCount, error) => {
      // Don't retry 404 (pincode not found)
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 1
    },
  })
}
