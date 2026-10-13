import React from 'react'
import { Package, Tag, IndianRupee, Sparkles } from 'lucide-react'
import { BentoCard } from '../ui/BentoCard'

export const CatalogStats = ({ products = [], totalCount = 0, brands = [], categories = [] }) => {
  const avgPrice = products.length
    ? (products.reduce((acc, p) => acc + parseFloat(p.price || 0), 0) / products.length).toFixed(2)
    : '0.00'

  const aiTaggedCount = products.filter((p) => p.tags && p.tags.length > 0).length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Catalog */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Catalog</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {totalCount}
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-subtle)' }}>items</span>
        </div>
      </BentoCard>

      {/* Brands & Categories */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Brands & Categories</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {brands.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>brands /</span>
          <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
            {categories.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>categories</span>
        </div>
      </BentoCard>

      {/* Average Price */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Page Average Price</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            ₹{avgPrice}
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-subtle)' }}>INR</span>
        </div>
      </BentoCard>

      {/* AI Tagged & Indexed */}
      <BentoCard highlight glowing className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>AI Tagged & Indexed</span>
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {aiTaggedCount}
          </span>
          <span className="text-xs" style={{ color: 'var(--accent)' }}>on this view</span>
        </div>
      </BentoCard>
    </div>
  )
}
