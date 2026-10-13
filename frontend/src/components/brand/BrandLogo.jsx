import React from 'react'
import { Link } from 'react-router-dom'

export const BrandLogo = ({
  size = 'md',
  showText = true,
  asLink = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      box: 'w-7 h-7 rounded-lg',
      iconSize: 14,
      text: 'text-base',
      badge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      box: 'w-9 h-9 rounded-xl',
      iconSize: 18,
      text: 'text-lg',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      box: 'w-12 h-12 rounded-2xl',
      iconSize: 24,
      text: 'text-2xl',
      badge: 'text-xs px-2 py-0.5',
    },
  }

  const current = sizeClasses[size] || sizeClasses.md

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Icon Mark with Emerald Grid treatment */}
      <div
        className={`${current.box} relative flex items-center justify-center p-[1px] transition-all duration-300 group-hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, var(--border-strong) 0%, var(--accent) 50%, #55D6A4 100%)',
          boxShadow: '0 0 16px var(--glow)',
        }}
      >
        <div
          className="w-full h-full rounded-[inherit] flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          {/* Faint technical grid background in logo */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
              backgroundSize: '6px 6px',
            }}
          />

          {/* Faceted Catalog Cube Emblem */}
          <svg
            width={current.iconSize}
            height={current.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10 transition-colors duration-300"
            style={{ color: 'var(--accent)' }}
          >
            <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" fill="var(--accent-soft)" />
            <path d="M12 22V12" />
            <path d="M20 7l-8 5-8-5" />
            <circle cx="12" cy="12" r="1.5" fill="var(--accent)" stroke="none" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight leading-none ${current.text}`} style={{ color: 'var(--text)' }}>
            Catalog<span className="brand-gradient-text ml-0.5">IQ</span>
          </span>
          <span className="text-[10px] tracking-wider font-mono uppercase text-[var(--text-subtle)] mt-0.5 hidden sm:block">
            Product Intelligence
          </span>
        </div>
      )}
    </div>
  )

  if (asLink) {
    return (
      <Link to="/" className="inline-flex focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
