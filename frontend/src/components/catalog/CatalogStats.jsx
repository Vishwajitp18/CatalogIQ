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
      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Catalog</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
            {totalCount}
          </span>
          <span className="text-xs text-slate-500 ml-2">items</span>
        </div>
      </BentoCard>

      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Brands & Categories</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Tag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
            {brands.length}
          </span>
          <span className="text-xs text-slate-400">brands /</span>
          <span className="text-lg font-semibold text-slate-300 tabular-nums">
            {categories.length}
          </span>
          <span className="text-xs text-slate-400">categories</span>
        </div>
      </BentoCard>

      <BentoCard highlight className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Page Average Price</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
            ₹{avgPrice}
          </span>
          <span className="text-xs text-slate-500 ml-2">INR</span>
        </div>
      </BentoCard>

      <BentoCard highlight glowing className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-300">AI Tagged & Indexed</span>
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
            {aiTaggedCount}
          </span>
          <span className="text-xs text-purple-400">on this view</span>
        </div>
      </BentoCard>
    </div>
  )
}

