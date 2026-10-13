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
      'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--border-strong)] shadow-[0_0_10px_var(--glow)]',
    success:
      'bg-emerald-950/40 text-emerald-300 dark:text-emerald-300 border-emerald-500/30',
    warning:
      'bg-amber-950/40 text-amber-300 dark:text-amber-300 border-amber-500/30',
    danger:
      'bg-rose-950/40 text-rose-300 dark:text-rose-300 border-rose-500/30',
    brand:
      'bg-teal-950/40 text-teal-300 dark:text-teal-300 border-teal-500/30',
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
