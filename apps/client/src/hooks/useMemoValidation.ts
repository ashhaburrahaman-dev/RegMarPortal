import { useQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import { api } from '@/lib/api'

/**
 * Validates a memo number for uniqueness against the server.
 * Debounced via React's useDeferredValue.
 *
 * @param memo - The memo number to validate (e.g. "45A/44/2026")
 * @param excludeId - If editing, exclude this record's ID from the check
 */
export function useMemoValidation(memo: string | undefined, excludeId?: string) {
  const deferredMemo = useDeferredValue(memo)
  const isValid = typeof deferredMemo === 'string' && deferredMemo.length >= 3

  const params = new URLSearchParams({ memo: deferredMemo ?? '' })
  if (excludeId) params.set('excludeId', excludeId)

  return useQuery({
    queryKey: ['memo-validate', deferredMemo, excludeId],
    queryFn: () => api.get<{ exists: boolean }>(`/memo/validate?${params.toString()}`),
    enabled: isValid,
    staleTime: 0, // Always re-validate
    gcTime: 0,
  })
}
