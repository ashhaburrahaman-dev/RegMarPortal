/**
 * Typed fetch wrapper for the Worker API.
 *
 * Features:
 * - Automatically prepends VITE_API_BASE_URL
 * - Attaches credentials (cookies)
 * - Reads csrf_token cookie and adds X-CSRF-Token header on mutations
 * - Redirects to /login on 401
 * - Throws ApiError on non-OK responses
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE_URL = import.meta.env['VITE_API_BASE_URL'] ?? '/api/v1'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  return match?.[1] ?? null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }

  if (MUTATION_METHODS.has(method.toUpperCase())) {
    const csrf = getCsrfToken()
    if (csrf) headers['X-CSRF-Token'] = csrf
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (response.status === 401) {
    // Redirect to login if unauthenticated
    window.location.href = '/login'
    throw new ApiError(401, 'Session expired — redirecting to login')
  }

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { error: response.statusText }
    }
    const message =
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'error' in errorBody &&
      typeof (errorBody as { error: unknown }).error === 'string'
        ? (errorBody as { error: string }).error
        : `HTTP ${response.status}`
    throw new ApiError(response.status, message, errorBody)
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

/**
 * Fetches a blob (used for PDF download).
 */
export async function fetchBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const csrf = getCsrfToken()
  const headers: Record<string, string> = {}
  if (csrf) headers['X-CSRF-Token'] = csrf

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  })

  if (response.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, 'Session expired')
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Failed to download PDF: HTTP ${response.status}`)
  }

  const contentDisposition = response.headers.get('Content-Disposition') ?? ''
  const filenameMatch = contentDisposition.match(/filename="(.+)"/)
  const filename = filenameMatch?.[1] ?? 'certificate.pdf'

  return { blob: await response.blob(), filename }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
