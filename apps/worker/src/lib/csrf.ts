/**
 * Generates a cryptographically random CSRF token.
 * This token is stored in a non-HTTP-only cookie and sent
 * back via the X-CSRF-Token request header.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}

/**
 * Validates that the CSRF token from the cookie matches
 * the one sent in the X-CSRF-Token header.
 */
export function validateCsrfTokens(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false
  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) return false
  let diff = 0
  for (let i = 0; i < cookieToken.length; i++) {
    diff |= cookieToken.charCodeAt(i) ^ (headerToken.charCodeAt(i) ?? 0)
  }
  return diff === 0
}
