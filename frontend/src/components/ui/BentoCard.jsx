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
        relative rounded-2xl glass-card p-6 overflow-hidden
        ${highlight ? 'bento-highlight' : ''}
        ${glowing ? 'border-purple-500/30 shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

