/**
 * Helper for making authenticated admin API calls.
 * Wraps fetch() with the Authorization header from the auth token.
 */
export async function adminFetch(
  url: string,
  token: string | null,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Set Content-Type for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
