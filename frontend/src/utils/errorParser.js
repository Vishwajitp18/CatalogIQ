/**
 * Production-grade API Error Parser
 * Extracts structured error information, titles, and exact human-friendly backend messages from API responses.
 * Guarantees that exact validation messages from backend details are prioritized over generic fallbacks.
 */

export function extractBackendValidationMessages(data) {
  if (!data) return []

  // If data is a string
  if (typeof data === 'string') {
    if (data.trim().startsWith('<')) return []
    return [data.trim()]
  }

  const target = data && typeof data === 'object' && data.error ? data.error : data
  if (typeof target === 'string') {
    if (target.trim().startsWith('<')) return []
    return [target.trim()]
  }

  const messages = []

  // 1. Extract from details (field-level validation map)
  const details =
    target.details !== undefined && target.details !== null
      ? target.details
      : data.error
      ? null
      : data.detail
      ? null
      : data

  if (details) {
    if (typeof details === 'string' && details.trim()) {
      messages.push(details.trim())
    } else if (Array.isArray(details)) {
      details.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          messages.push(item.trim())
        } else if (item && typeof item === 'object') {
          messages.push(...extractBackendValidationMessages(item))
        }
      })
    } else if (typeof details === 'object') {
      for (const [key, val] of Object.entries(details)) {
        if (key === 'request_id' || key === 'code' || key === 'status' || key === 'message') continue

        const formattedKey =
          key === 'non_field_errors' || key === 'detail' || key === '__all__'
            ? ''
            : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

        let fieldMessages = []
        if (typeof val === 'string') {
          fieldMessages = [val.trim()]
        } else if (Array.isArray(val)) {
          fieldMessages = val
            .map((v) => (typeof v === 'string' ? v.trim() : JSON.stringify(v)))
            .filter(Boolean)
        } else if (val && typeof val === 'object') {
          fieldMessages = extractBackendValidationMessages(val)
        }

        if (fieldMessages.length > 0) {
          fieldMessages.forEach((msg) => {
            if (formattedKey && !msg.toLowerCase().includes(formattedKey.toLowerCase())) {
              messages.push(`${formattedKey}: ${msg}`)
            } else {
              messages.push(msg)
            }
          })
        }
      }
    }
  }

  // 2. Extract from errors array (e.g. data.errors = [{ message: ... }])
  if (Array.isArray(target.errors)) {
    target.errors.forEach((err) => {
      if (typeof err === 'string' && err.trim()) messages.push(err.trim())
      else if (err?.message && typeof err.message === 'string') messages.push(err.message.trim())
    })
  }

  // 3. Extract from target.non_field_errors
  if (Array.isArray(target.non_field_errors)) {
    target.non_field_errors.forEach((msg) => {
      if (typeof msg === 'string' && msg.trim()) messages.push(msg.trim())
    })
  }

  // 4. Extract from target.detail
  if (typeof target.detail === 'string' && target.detail.trim()) {
    messages.push(target.detail.trim())
  }

  // 5. If no field messages were found, check target.message
  if (messages.length === 0 && typeof target.message === 'string' && target.message.trim()) {
    const trimmed = target.message.trim()
    if (trimmed !== 'Invalid input.' && trimmed !== 'An error occurred.') {
      messages.push(trimmed)
    }
  }

  return [...new Set(messages)]
}

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

  const backendError = data && typeof data === 'object' ? data.error : null
  const serverCode =
    backendError?.code ||
    (data && typeof data === 'object' ? data.code : null) ||
    (status ? `http_${status}` : 'error')

  // Extract EXACT messages from backend details/errors
  const exactMessages = extractBackendValidationMessages(data)

  let title = status ? `HTTP ${status} Error` : 'Action Failed'
  if (status === 400 || serverCode === 'validation_error') {
    title = 'Validation Error'
  } else if (status === 401 || serverCode === 'not_authenticated' || serverCode === 'invalid_credentials') {
    title = 'Authentication Required'
  } else if (status === 403 || serverCode === 'permission_denied') {
    title = 'Permission Denied'
  } else if (status === 404 || serverCode === 'not_found') {
    title = 'Not Found'
  } else if (status === 409 || serverCode === 'conflict') {
    title = 'Conflict'
  } else if (status === 429 || serverCode === 'throttled') {
    title = 'Rate Limit Exceeded'
  } else if (status === 502 || serverCode === 'ai_invalid_output') {
    title = 'AI Provider Error'
  } else if (status === 503 || serverCode === 'ai_unavailable' || serverCode === 'ai_not_configured') {
    title = 'Service Unavailable'
  } else if (status && status >= 500) {
    title = 'Server Error'
  }

  let finalMessage = ''

  if (exactMessages.length === 1) {
    finalMessage = exactMessages[0]
  } else if (exactMessages.length > 1) {
    finalMessage = exactMessages.map((m) => `• ${m}`).join('\n')
  } else {
    // If backend provided no exact message at all:
    if (status === 403 || serverCode === 'permission_denied') {
      finalMessage =
        'You do not have permission to perform this action because you are not its owner. In CatalogIQ, only the creator or an Administrator has edit/delete rights.'
    } else if (status === 401 || serverCode === 'not_authenticated' || serverCode === 'invalid_credentials') {
      finalMessage = 'Your session has expired or credentials were not provided. Please sign in.'
    } else if (status === 404 || serverCode === 'not_found') {
      finalMessage = 'The requested resource could not be found.'
    } else if (status === 409 || serverCode === 'conflict') {
      finalMessage = 'This operation conflicts with an existing item in the catalog.'
    } else if (status === 429 || serverCode === 'throttled') {
      finalMessage = 'Too many requests were sent in a short window. Please wait a few seconds before trying again.'
    } else if (!response && error.message?.includes('Network Error')) {
      title = 'Network Connection Error'
      finalMessage =
        'Unable to reach the CatalogIQ backend API server. Please check your network connection.'
    } else {
      finalMessage =
        (typeof data === 'string' && !data.trim().startsWith('<') ? data.trim() : null) ||
        backendError?.message ||
        error.message ||
        defaultFallback
    }
  }

  return {
    title,
    message: finalMessage,
    status,
    code: serverCode,
    details: backendError?.details || (data && typeof data === 'object' ? data : null),
  }
}
