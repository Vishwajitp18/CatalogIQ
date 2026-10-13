import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="group relative p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-200 border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 shadow-sm"
        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-[var(--accent)] group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--accent)] group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>
      {showLabel && (
        <span className="ml-2 text-xs font-medium text-[var(--text-muted)]">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  )
}
