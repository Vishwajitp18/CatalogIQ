import React from 'react'

export const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
            style={{ color: 'var(--text-subtle)' }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`
            w-full rounded-xl theme-input px-3.5 py-2.5 text-sm
            transition-all duration-150
            focus:outline-none
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-[var(--danger-border)] focus:border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger)]/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--danger-text)] mt-1 flex items-center gap-1 font-medium">
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
