import React from 'react'
import { X, SlidersHorizontal, Search } from 'lucide-react'
import { Select } from '../ui/Select'

export const CatalogFilters = ({
  filters,
  onChange,
  onReset,
  brands = [],
  categories = [],
}) => {
  const handleBrandToggle = (brandKey) => {
    const isCurrent =
      filters.brand === brandKey ||
      (brandKey === '' && !filters.brand)
    onChange({
      brand: isCurrent ? '' : brandKey,
    })
  }

  const handleCategoryToggle = (catKey) => {
    const isCurrent =
      filters.category === catKey ||
      (catKey === '' && !filters.category)
    onChange({
      category: isCurrent ? '' : catKey,
    })
  }

  const hasActiveFilters =
    Boolean(filters.brand) ||
    Boolean(filters.category) ||
    Boolean(filters.min_price) ||
    Boolean(filters.max_price) ||
    Boolean(filters.search) ||
    Boolean(filters.is_active === 'false')

  return (
    <div className="surface-card rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Filters & Sorting
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset all
          </button>
        )}
      </div>

      {/* Keyword Search */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium block" style={{ color: 'var(--text-muted)' }}>
          Keyword Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search title, tag..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-xl theme-input pl-8 pr-7 py-2 text-xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Clear search keyword"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sorting */}
      <Select
        label="Sort By"
        size="sm"
        value={filters.ordering || '-created_at'}
        onChange={(val) => onChange({ ordering: val })}
        options={[
          { value: '-created_at', label: 'Newest First' },
          { value: 'created_at', label: 'Oldest First' },
          { value: 'price', label: 'Price: Low to High' },
          { value: '-price', label: 'Price: High to Low' },
          { value: 'name', label: 'Name: A to Z' },
          { value: '-name', label: 'Name: Z to A' },
        ]}
      />

      {/* Price Range */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium block" style={{ color: 'var(--text-muted)' }}>
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => onChange({ min_price: e.target.value })}
            className="w-full rounded-xl theme-input px-3 py-1.5 text-xs"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => onChange({ max_price: e.target.value })}
            className="w-full rounded-xl theme-input px-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium block" style={{ color: 'var(--text-muted)' }}>
            Categories
          </label>
          {filters.category && (
            <button
              type="button"
              onClick={() => handleCategoryToggle('')}
              className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => handleCategoryToggle('')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              !filters.category
                ? 'bg-[var(--accent-soft)] border-[var(--border-strong)] text-[var(--accent)] font-semibold shadow-sm'
                : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const key = cat.slug || String(cat.id)
            const isSelected =
              filters.category === key ||
              filters.category === cat.slug ||
              filters.category === String(cat.id) ||
              filters.category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryToggle(key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] border-[var(--border-strong)] text-[var(--accent)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Brand Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium block" style={{ color: 'var(--text-muted)' }}>
            Brands
          </label>
          {filters.brand && (
            <button
              type="button"
              onClick={() => handleBrandToggle('')}
              className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => handleBrandToggle('')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              !filters.brand
                ? 'bg-[var(--accent-soft)] border-[var(--border-strong)] text-[var(--accent)] font-semibold shadow-sm'
                : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            All
          </button>
          {brands.map((b) => {
            const key = b.slug || String(b.id)
            const isSelected =
              filters.brand === key ||
              filters.brand === b.slug ||
              filters.brand === String(b.id) ||
              filters.brand === b.id
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBrandToggle(key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] border-[var(--border-strong)] text-[var(--accent)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {b.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
