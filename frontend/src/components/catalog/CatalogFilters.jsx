import React from 'react'
import { X, SlidersHorizontal, Search } from 'lucide-react'

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
    <div className="glass-card rounded-2xl p-5 space-y-5 border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Filters & Sorting</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset all
          </button>
        )}
      </div>

      {/* Keyword Search */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 block">Keyword Search</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search title, tag..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-xl glass-input pl-8 pr-7 py-2 text-xs placeholder-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sorting */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 block">Sort By</label>
        <div className="relative">
          <select
            value={filters.ordering || '-created_at'}
            onChange={(e) => onChange({ ordering: e.target.value })}
            className="w-full rounded-xl glass-input px-3.5 py-2 text-xs bg-slate-900/90 text-slate-200 border border-white/10 focus:outline-none focus:border-purple-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="-name">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 block">Price Range (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => onChange({ min_price: e.target.value })}
            className="w-full rounded-xl glass-input px-3 py-1.5 text-xs placeholder-slate-500"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => onChange({ max_price: e.target.value })}
            className="w-full rounded-xl glass-input px-3 py-1.5 text-xs placeholder-slate-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400 block">Categories</label>
          {filters.category && (
            <button
              type="button"
              onClick={() => handleCategoryToggle('')}
              className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
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
                ? 'bg-purple-600/30 border-purple-500/60 text-purple-200 font-medium shadow-sm'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
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
                    ? 'bg-purple-600/30 border-purple-500/60 text-purple-200 font-medium shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
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
          <label className="text-xs font-medium text-slate-400 block">Brands</label>
          {filters.brand && (
            <button
              type="button"
              onClick={() => handleBrandToggle('')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
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
                ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-200 font-medium shadow-sm'
                : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
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
                    ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-200 font-medium shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
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



