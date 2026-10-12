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
  const backendError = data && typeof data === 'object' ? data.error : null
  const serverCode = backendError?.code || (data && typeof data === 'object' ? data.code : null) || (status ? `http_${status}` : 'error')

  // Extract human-friendly message string
  let rawMessage = ''
  if (typeof data === 'string') {
    // If backend returned raw HTML (e.g., debug crash page), do NOT display HTML tags
    if (data.trim().startsWith('<')) {
      rawMessage = `The server returned an unhandled error (${status || 500}). Please check the backend logs.`
    } else {
      rawMessage = data.trim()
    }
  } else if (data && typeof data === 'object') {
    rawMessage =
      backendError?.message ||
      data.detail ||
      data.message ||
      (Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : null) ||
      ''
  }

  // Extract field-level validation details
  const details =
    backendError?.details ||
    (data && typeof data === 'object' && !backendError && !data.detail ? data : null)

  let title = status ? `HTTP ${status} Error` : 'Action Failed'
  let reason = rawMessage

  if (status === 403 || serverCode === 'permission_denied') {
    title = '403 Forbidden • Permission Denied'
    if (!reason || reason === 'You do not have permission to perform this action.') {
      reason = 'You do not have permission to modify or delete this item because you are not its owner. In CatalogIQ, only the creator or an Administrator has full master rights.'
    } else {
      reason = `Permission Denied: ${reason}`
    }
  } else if (status === 401 || serverCode === 'not_authenticated' || serverCode === 'invalid_credentials') {
    title = '401 Unauthorized • Sign In Required'
    if (!reason || reason === 'Authentication failed.' || reason === 'User not found or inactive') {
      reason = 'Your session has expired or you need to sign in to perform this action. Use the Quick Demo Logins on the Login page.'
    }
  } else if (status === 404 || serverCode === 'not_found') {
    title = '404 Not Found'
    if (!reason || reason === 'Resource not found.') {
      reason = 'The requested catalog product, brand, or resource could not be found.'
    }
  } else if (status === 409 || serverCode === 'conflict') {
    title = '409 Conflict • Duplicate Resource'
    if (!reason) {
      reason = 'This operation conflicts with existing catalog data (e.g. a product with this name or SKU already exists).'
    }
  } else if (status === 400 || serverCode === 'validation_error') {
    title = '400 Bad Request • Validation Error'
    if (!reason || reason === 'Invalid input.') {
      reason = 'Please check the values you entered. One or more fields are invalid.'
    }
    // Format field-level errors into clean bullet points
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      const fieldItems = Object.entries(details)
        .filter(([k]) => k !== 'request_id' && k !== 'code' && k !== 'message' && k !== 'non_field_errors')
        .map(([field, errList]) => {
          const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          const text = Array.isArray(errList) ? errList.join(' ') : String(errList)
          return `• ${formattedField}: ${text}`
        })
      if (fieldItems.length > 0) {
        reason = `${reason}\n${fieldItems.join('\n')}`
      }
    }
  } else if (status === 429 || serverCode === 'throttled') {
    title = '429 Rate Limit Exceeded'
    if (!reason) {
      reason = 'Too many requests were sent in a short window. Please wait a few seconds before trying again.'
    }
  } else if (status === 502 || serverCode === 'ai_invalid_output') {
    title = '502 AI Provider Error'
    if (!reason) {
      reason = 'The AI inference provider (Groq Qwen 27B) returned an invalid response schema. Please retry.'
    }
  } else if (status === 503 || serverCode === 'ai_unavailable' || serverCode === 'ai_not_configured') {
    title = '503 Service Unavailable'
    if (!reason) {
      reason = 'The service or AI provider is temporarily busy. Please wait a moment.'
    }
  } else if (status && status >= 500) {
    title = `${status} Server Error`
    if (!reason || reason === 'An unexpected server error occurred.') {
      reason = 'An unexpected server error occurred while processing your request. Please try again shortly.'
    }
  } else if (!response && error.message?.includes('Network Error')) {
    title = 'Network Connection Error'
    reason = 'Unable to reach the CatalogIQ backend API server. Please check your network connection or ensure the Django server is running.'
  }

  const finalMessage = reason || error.message || defaultFallback

  return {
    title,
    message: finalMessage,
    status,
    code: serverCode,
    details,
  }
}

