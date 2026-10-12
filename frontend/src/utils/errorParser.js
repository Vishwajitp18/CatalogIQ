/**
 * Production-grade API Error Parser
 * Extracts structured error information, titles, and human-friendly reasons from API responses.
 */

export function parseApiError(error, defaultFallback = 'An error occurred.') {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: defaultFallback,
      status: null,
      code: 'unknown',
      details: null,
    }
  }

  if (typeof error === 'string') {
    return {
      title: 'Notice',
      message: error,
      status: null,
      code: 'client_error',
      details: null,
    }
  }

  const response = error.response
  const status = response?.status
  const data = response?.data

  // Extract from standardized backend error envelope: { error: { code, message, details } }
  const backendError = data?.error
  const serverCode = backendError?.code || data?.code || (status ? `http_${status}` : 'error')
  let serverMessage = backendError?.message || data?.detail || data?.message

  // Extract field-level validation details
  const details = backendError?.details || data?.details || (data && typeof data === 'object' && !backendError ? data : null)

  let title = 'Error'

  if (status === 403 || serverCode === 'permission_denied') {
    title = 'Permission Denied (403)'
    if (!serverMessage || serverMessage === 'You do not have permission to perform this action.') {
      serverMessage = 'You do not have permission to modify or delete this item because you are not its owner or staff.'
    }
  } else if (status === 401 || serverCode === 'not_authenticated' || serverCode === 'invalid_credentials') {
    title = 'Authentication Required (401)'
    if (!serverMessage || serverMessage === 'Authentication failed.') {
      serverMessage = 'Your session has expired or you need to sign in to perform this action.'
    }
  } else if (status === 404 || serverCode === 'not_found') {
    title = 'Resource Not Found (404)'
    if (!serverMessage || serverMessage === 'Resource not found.') {
      serverMessage = 'The requested item or resource could not be found.'
    }
  } else if (status === 400 || serverCode === 'validation_error') {
    title = 'Validation Error (400)'
    if (!serverMessage || serverMessage === 'Invalid input.') {
      serverMessage = 'Please verify your input. One or more fields are invalid.'
    }
    // If details object contains field-level errors, format them clearly
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      const fieldItems = Object.entries(details)
        .filter(([k]) => k !== 'request_id' && k !== 'code' && k !== 'message')
        .map(([field, errList]) => {
          const text = Array.isArray(errList) ? errList.join(' ') : String(errList)
          return `${field}: ${text}`
        })
      if (fieldItems.length > 0) {
        serverMessage = `${serverMessage} • ${fieldItems.join(' • ')}`
      }
    }
  } else if (status === 429 || serverCode === 'throttled') {
    title = 'Rate Limit Exceeded (429)'
    if (!serverMessage) {
      serverMessage = 'Too many requests in a short period. Please wait a moment before trying again.'
    }
  } else if (status === 502 || serverCode === 'ai_invalid_output') {
    title = 'AI Provider Output Error (502)'
    if (!serverMessage) {
      serverMessage = 'The AI model returned an unexpected response. Please retry.'
    }
  } else if (status === 503 || serverCode === 'ai_unavailable' || serverCode === 'ai_not_configured') {
    title = 'AI Service Unavailable (503)'
    if (!serverMessage) {
      serverMessage = 'AI service is temporarily busy or not configured. Please try again shortly.'
    }
  } else if (status && status >= 500) {
    title = `Server Error (${status})`
    if (!serverMessage || serverMessage === 'An unexpected server error occurred.') {
      serverMessage = 'An unexpected server error occurred. Please try again shortly.'
    }
  } else if (!response && error.message?.includes('Network Error')) {
    title = 'Network Connection Error'
    serverMessage = 'Unable to reach the API server. Please check your network connection.'
  }

  const finalMessage = serverMessage || error.message || defaultFallback

  return {
    title,
    message: finalMessage,
    status,
    code: serverCode,
    details,
  }
}

