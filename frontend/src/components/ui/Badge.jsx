import React from 'react'

export const Badge = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'sm',
  ...props
}) => {
  const variantStyles = {
    neutral:
      'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]',
    ai:
      'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-strong)] shadow-[0_0_8px_var(--glow)]',
    success:
      'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
    warning:
      'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
    danger:
      'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]',
    brand:
      'bg-[var(--brand-bg)] text-[var(--brand-text)] border-[var(--brand-border)]',
  }

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
