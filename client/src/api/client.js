// This file is our helper for making API requests to the backend
// Instead of writing fetch() everywhere, we use apiFetch() which handles
// the auth token and error messages automatically

// The base URL of our backend server
const BASE_URL = 'https://digital-garden-api.up.railway.app'

// apiFetch wraps the built-in fetch() to automatically:
// - Attach the user's login token to every request
// - Handle 401 (not logged in) errors by redirecting to login
// - Parse error messages from the server
export async function apiFetch(path, options = {}) {
  // Get the saved login token from localStorage
  const token = localStorage.getItem('token')

  // Check if we're sending FormData (for file uploads)
  // FormData needs a special Content-Type header that the browser sets automatically
  const isFormData = options.body instanceof FormData

  // Build the headers for the request
  const headers = {
    // Don't set Content-Type for FormData — browser sets it with the boundary
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    // Add the Authorization header if we have a token
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Merge in any extra headers the caller passed in
    ...(options.headers || {}),
  }

  // Make the actual HTTP request
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers,
  })

  // If the server says we're not authenticated, log out and go to login page
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  // If the request failed for any other reason, throw an error with the message
  if (!res.ok) {
    let message = 'Request failed'
    try {
      // Try to get the error message from the server's JSON response
      const data = await res.json()
      message = data.error || message
    } catch {}
    throw new Error(message)
  }

  // If the response has JSON data, parse and return it
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return res.json()
  }

  // Otherwise return null (for responses with no body)
  return null
}
