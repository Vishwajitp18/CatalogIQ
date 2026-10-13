import React from 'react'

export const BentoCard = ({
  children,
  className = '',
  glowing = false,
  highlight = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl surface-card p-6 overflow-hidden
        ${highlight ? 'emerald-card-highlight' : ''}
        ${glowing ? 'border-[var(--border-strong)] shadow-[0_0_24px_var(--glow)]' : ''}
        ${onClick ? 'cursor-pointer hover:border-[var(--accent)] hover:shadow-lg' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
