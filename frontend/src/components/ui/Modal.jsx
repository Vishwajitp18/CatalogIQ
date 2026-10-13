import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        style={{ backgroundColor: 'var(--modal-backdrop)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative w-full ${maxWidth} max-h-[92vh] flex flex-col rounded-2xl z-10
          surface-panel border-[var(--border-strong)] shadow-2xl
          animate-in zoom-in-95 duration-200 overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
          <div>
            {title && (
              <h3
                id="modal-title"
                className="text-lg sm:text-xl font-semibold tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--border)] shrink-0 flex items-center justify-end gap-3 bg-[var(--surface-muted)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
