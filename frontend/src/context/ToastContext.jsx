import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ToastContainer } from '../components/ui/Toast'
import { parseApiError } from '../utils/errorParser'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(({ type = 'info', title, message, status = null, code = null, duration = 6000 }) => {
    const id = crypto.randomUUID()
    const newToast = { id, type, title, message, status, code, duration }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const showError = useCallback(
    (error, fallbackTitle = 'Action Failed') => {
      const parsed = parseApiError(error)
      return showToast({
        type: 'error',
        title: parsed.title || fallbackTitle,
        message: parsed.message,
        status: parsed.status,
        code: parsed.code,
        duration: 9000, // Longer display for errors so users can read the reason
      })
    },
    [showToast]
  )

  const showSuccess = useCallback(
    (message, title = 'Success') => {
      return showToast({
        type: 'success',
        title,
        message,
        duration: 4000,
      })
    },
    [showToast]
  )

  const showWarning = useCallback(
    (message, title = 'Warning') => {
      return showToast({
        type: 'warning',
        title,
        message,
        duration: 6000,
      })
    },
    [showToast]
  )

  const showInfo = useCallback(
    (message, title = 'Information') => {
      return showToast({
        type: 'info',
        title,
        message,
        duration: 5000,
      })
    },
    [showToast]
  )

  // Listen for global custom event 'app:toast' from non-React modules (like axios interceptors)
  useEffect(() => {
    const handleGlobalToast = (e) => {
      if (!e.detail) return
      const { type = 'info', title, message, duration, error } = e.detail
      if (error) {
        showError(error, title)
      } else {
        showToast({ type, title, message, duration })
      }
    }

    window.addEventListener('app:toast', handleGlobalToast)
    return () => window.removeEventListener('app:toast', handleGlobalToast)
  }, [showError, showToast])

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

