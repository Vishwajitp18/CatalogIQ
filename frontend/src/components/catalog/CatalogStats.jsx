import React from 'react'
import { Package, Tag, IndianRupee, Sparkles } from 'lucide-react'
import { BentoCard } from '../ui/BentoCard'

export const CatalogStats = ({
  stats = null,
  isLoading = false,
  totalCount = 0,
  brands = [],
  categories = [],
}) => {
  const totalProducts = stats?.total_products ?? totalCount ?? 0
  const totalBrands = stats?.total_brands ?? (Array.isArray(brands) ? brands.length : 0)
  const totalCategories = stats?.total_categories ?? (Array.isArray(categories) ? categories.length : 0)

  const rawAvgPrice = stats?.avg_price != null ? Number(stats.avg_price) : 0
  const formattedAvgPrice = rawAvgPrice.toFixed(2)

  const aiTaggedCount = stats?.ai_tagged_count ?? 0

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${isLoading ? 'opacity-80' : 'opacity-100'}`}>
      {/* Total Catalog */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Catalog</span>
          <div className="p-2 rounded-xl bg-[var(--surface-muted)] text-[var(--accent)] border border-[var(--border)]">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {totalProducts}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>items</span>
        </div>
      </BentoCard>

      {/* Brands & Categories */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Brands & Categories</span>
          <div className="p-2 rounded-xl bg-[var(--brand-bg)] text-[var(--brand-text)] border border-[var(--brand-border)]">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {totalBrands}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>brands /</span>
          <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
            {totalCategories}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>categories</span>
        </div>
      </BentoCard>

      {/* Average Price */}
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Catalog Average Price</span>
          <div className="p-2 rounded-xl bg-[var(--surface-muted)] text-[var(--accent)] border border-[var(--border)]">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            ₹{formattedAvgPrice}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>INR</span>
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
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
            {aiTaggedCount}
          </span>
          <span className="text-xs" style={{ color: 'var(--accent)' }}>catalog items</span>
        </div>
      </BentoCard>
    </div>
  )
}
