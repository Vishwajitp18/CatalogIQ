import React from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="group relative p-2 rounded-xl text-slate-400 hover:text-white transition-all duration-200 border border-white/10 hover:border-emerald-500/40 bg-white/[0.03] hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-emerald-300 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-emerald-600 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>
      {showLabel && (
        <span className="ml-2 text-xs font-medium text-slate-400">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  )
}
