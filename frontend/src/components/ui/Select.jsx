import React, { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  error,
  icon: Icon,
  size = 'md',
  className = '',
  dropdownClassName = '',
  id,
  required = false,
}) => {
  const generatedId = useId()
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId)
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('touchstart', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isOpen])

  // Scroll focused option into view during keyboard navigation
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const optionElements = listRef.current.querySelectorAll('[role="option"]')
      if (optionElements[focusedIndex]) {
        optionElements[focusedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, isOpen])

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue)
    }
    setIsOpen(false)
    if (triggerRef.current) {
      triggerRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
        const curIdx = options.findIndex((opt) => String(opt.value) === String(value))
        setFocusedIndex(curIdx >= 0 ? curIdx : 0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && options[focusedIndex] && !options[focusedIndex].disabled) {
          handleSelect(options[focusedIndex].value)
        }
        break
      case 'Tab':
        setIsOpen(false)
        break
      default:
        break
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[32px]',
    md: 'text-sm px-3.5 py-2.5 min-h-[38px]',
  }

  return (
    <div className={`relative w-full space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {label} {required && <span className="text-[var(--danger-text)]">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          id={selectId}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev)
              const curIdx = options.findIndex((opt) => String(opt.value) === String(value))
              setFocusedIndex(curIdx >= 0 ? curIdx : 0)
            }
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          className={`
            w-full flex items-center justify-between gap-2 rounded-xl text-left font-normal
            transition-all duration-150 cursor-pointer select-none
            bg-[var(--input-bg)] text-[var(--text)] border
            ${sizeClasses[size] || sizeClasses.md}
            ${
              error
                ? 'border-[var(--danger-border)] focus:border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger)]/20'
                : isOpen
                ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]'
                : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <div className="flex items-center gap-2 truncate">
            {Icon && <Icon className="w-4 h-4 shrink-0 text-[var(--text-subtle)]" />}
            {selectedOption ? (
              <span className="truncate font-medium">{selectedOption.label}</span>
            ) : (
              <span className="truncate" style={{ color: 'var(--text-subtle)' }}>
                {placeholder}
              </span>
            )}
          </div>

          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-200 text-[var(--text-subtle)] ${
              isOpen ? 'rotate-180 text-[var(--accent)]' : ''
            }`}
          />
        </button>

        {/* Floating Custom Dropdown Menu */}
        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              focusedIndex >= 0 ? `${selectId}-opt-${focusedIndex}` : undefined
            }
            className={`
              absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto
              rounded-xl p-1.5 surface-panel border-[var(--border-strong)]
              shadow-2xl animate-in fade-in zoom-in-95 duration-150
              ${dropdownClassName}
            `}
            style={{
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--panel-shadow)',
            }}
          >
            {options.length === 0 ? (
              <div
                className="px-3 py-2 text-xs text-center"
                style={{ color: 'var(--text-subtle)' }}
              >
                No options available
              </div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value)
                const isFocused = idx === focusedIndex

                return (
                  <div
                    key={opt.value ?? idx}
                    id={`${selectId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!opt.disabled) {
                        handleSelect(opt.value)
                      }
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`
                      flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm
                      transition-colors cursor-pointer select-none
                      ${
                        isSelected
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                          : isFocused
                          ? 'bg-[var(--surface-hover)] text-[var(--text)]'
                          : 'text-[var(--text)] hover:bg-[var(--surface-hover)]'
                      }
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && (
                        <opt.icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'
                          }`}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--danger-text)] mt-1 flex items-center gap-1 font-medium">
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

