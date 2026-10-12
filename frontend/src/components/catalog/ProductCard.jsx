import React from 'react'
import { Eye, Edit3, Trash2 } from 'lucide-react'
import { BentoCard } from '../ui/BentoCard'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

export const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  const { isAuthenticated } = useAuth()

  return (
    <BentoCard
      highlight
      className="group flex flex-col justify-between p-5 hover:border-purple-500/30 transition-all duration-300"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.brand ? (
              <Badge variant="brand">{product.brand.name}</Badge>
            ) : null}
            {product.category ? (
              <Badge variant="neutral">{product.category.name}</Badge>
            ) : null}
          </div>

          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              product.is_active ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
            }`}
            title={product.is_active ? 'Active' : 'Inactive'}
          />
        </div>

        {/* Title & SKU */}
        <h3
          onClick={() => onView(product)}
          className="font-semibold text-white text-base leading-snug group-hover:text-purple-300 transition-colors cursor-pointer line-clamp-2"
        >
          {product.name}
        </h3>

        {product.sku && (
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            SKU: {product.sku}
          </p>
        )}

        {/* Description snippet */}
        <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
          {product.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-3">
            {product.tags.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-500/20"
              >
                #{t}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Price & Actions */}
      <div className="pt-4 mt-4 border-t border-white/[0.07] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 block">Price</span>
          <span className="text-xl font-bold text-white tabular-nums">
            ${parseFloat(product.price || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onView(product)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                title="Edit product"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to soft delete "${product.name}"?`
                    )
                  ) {
                    onDelete(product.id)
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </BentoCard>
  )
}

