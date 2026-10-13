import React, { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const TOAST_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

const TOAST_STYLES = {
  error: {
    container: 'bg-[var(--surface)] border-rose-500/40 text-rose-200 shadow-xl shadow-rose-950/20',
    iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    title: 'text-rose-100',
    progress: 'bg-rose-500',
  },
  warning: {
    container: 'bg-[var(--surface)] border-amber-500/40 text-amber-200 shadow-xl shadow-amber-950/20',
    iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    title: 'text-amber-100',
    progress: 'bg-amber-500',
  },
  success: {
    container: 'bg-[var(--surface)] border-emerald-500/40 text-emerald-200 shadow-xl shadow-emerald-950/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    title: 'text-emerald-100',
    progress: 'bg-emerald-500',
  },
  info: {
    container: 'bg-[var(--surface)] border-[var(--border-strong)] text-[var(--text)] shadow-xl shadow-emerald-950/20',
    iconBg: 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]',
    title: 'text-[var(--text)]',
    progress: 'bg-[var(--accent)]',
  },
}

export const ToastItem = ({ toast, onDismiss }) => {
  const { id, type = 'info', title, message, duration = 6000 } = toast
  const style = TOAST_STYLES[type] || TOAST_STYLES.info
  const Icon = TOAST_ICONS[type] || TOAST_ICONS.info
  const [progressWidth, setProgressWidth] = useState('100%')

  // Auto-dismiss cleanly outside render cycle
  useEffect(() => {
    if (!duration || duration <= 0) return

    const timer = setTimeout(() => {
      onDismiss(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  // Smooth CSS progress bar
  useEffect(() => {
    if (!duration || duration <= 0) return
    const frame = requestAnimationFrame(() => {
      setProgressWidth('0%')
    })
    return () => cancelAnimationFrame(frame)
  }, [duration])

  return (
    <div
      role="alert"
      className={`relative w-full rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 overflow-hidden pointer-events-auto ${style.container}`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {toast.status && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                  type === 'error'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : type === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                HTTP {toast.status}
              </span>
            )}
            {title && (
              <h4 className={`text-sm font-semibold tracking-tight leading-snug ${style.title}`}>
                {title}
              </h4>
            )}
          </div>
          <p
            className="text-xs leading-relaxed opacity-90 break-words whitespace-pre-line"
            style={{ color: 'var(--text-muted)' }}
          >
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${style.progress}`}
          style={{
            width: progressWidth,
            transitionDuration: `${duration}ms`,
          }}
        />
      )}
    </div>
  )
}

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
