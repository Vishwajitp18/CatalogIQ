import React from 'react'
import { Loader2 } from 'lucide-react'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 rounded-xl select-none cursor-pointer ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]'

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 gap-2 min-h-[38px]',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[44px]',
  }

  const variantStyles = {
    primary:
      'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-sm hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)] border border-[var(--accent-pressed)]',
    ai:
      'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-[0_0_16px_var(--glow)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)] border border-[var(--accent-pressed)]',
    secondary:
      'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
    ghost:
      'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent',
    danger:
      'bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] hover:opacity-90 active:opacity-100',
    outline:
      'bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 text-current" />
      ) : null}
      {children}
    </button>
  )
}
