import React, { useState } from 'react'
import { Eye, Edit3, Trash2, Package, Lock, Shield } from 'lucide-react'
import { BentoCard } from '../ui/BentoCard'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

export const ProductCard = ({ product, onView, onEdit, onDelete }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  const [imageError, setImageError] = useState(false)
  const isActive = product.is_active !== false
  const canEdit = product.can_edit !== false


  return (
    <BentoCard
      highlight
      className="group flex flex-col justify-between p-5 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
    >
      <div>
        {/* Product Image Showcase */}
        <div
          onClick={() => onView(product)}
          className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900/90 border border-white/[0.08] mb-3.5 cursor-pointer group/img"
        >
          {product.image_url && !imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-cyan-950/20 text-slate-500">
              <Package className="w-8 h-8 group-hover/img:text-purple-400 group-hover/img:scale-110 transition-all" />
              <span className="text-[10px] mt-1 text-slate-500 font-mono">CatalogIQ</span>
            </div>
          )}

          {/* Active Status Badge in Top-Right Corner */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border ${
                isActive
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
                }`}
              />
              <span>{isActive ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        </div>

        {/* Brand, Category & Access Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {product.brand ? (
            <Badge variant="brand">{product.brand.name}</Badge>
          ) : null}
          {product.category ? (
            <Badge variant="neutral">{product.category.name}</Badge>
          ) : null}
          {isAuthenticated && (
            isAdmin ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300 font-medium"
                title="Admin Privileges: Full rights to modify or delete this item"
              >
                <Shield className="w-2.5 h-2.5 text-purple-400" />
                <span>Admin Rights</span>
              </span>
            ) : !canEdit ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-400 font-medium"
                title={`Created by ${product.created_by_email || 'Admin'}. Read-only for standard users.`}
              >
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                <span>Read-Only</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium"
                title="You created this product"
              >
                <span>Your Item</span>
              </span>
            )
          )}
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
            ₹{parseFloat(product.price || 0).toFixed(2)}
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
                className={`p-1.5 rounded-lg transition-colors ${
                  canEdit
                    ? 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
                    : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
                title={
                  canEdit
                    ? isAdmin
                      ? 'Admin: Edit product (Full Rights)'
                      : 'Edit your product'
                    : `Read-only: Created by ${product.created_by_email || 'Admin'}`
                }
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
                className={`p-1.5 rounded-lg transition-colors ${
                  canEdit
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                    : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                }`}
                title={
                  canEdit
                    ? isAdmin
                      ? 'Admin: Delete product (Full Rights)'
                      : 'Delete your product'
                    : `Read-only: Created by ${product.created_by_email || 'Admin'}`
                }
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

