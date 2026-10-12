import React from 'react'

export const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const variantStyles = {
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    ai: 'bg-purple-950/40 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
    brand: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur-md transition-all ${variantStyles[variant] || variantStyles.neutral} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

