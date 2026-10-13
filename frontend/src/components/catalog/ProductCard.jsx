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
      className="group flex flex-col justify-between p-5 hover:border-[var(--accent)] transition-all duration-300 overflow-hidden"
    >
      <div>
        {/* Product Image Showcase */}
        <div
          onClick={() => onView(product)}
          className="relative w-full h-44 rounded-xl overflow-hidden mb-3.5 cursor-pointer group/img border"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border)',
          }}
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
            <div
              className="w-full h-full flex flex-col items-center justify-center text-[var(--text-subtle)]"
              style={{
                background: 'radial-gradient(ellipse at center, var(--accent-soft) 0%, var(--surface-muted) 80%)',
              }}
            >
              <Package className="w-8 h-8 text-[var(--accent)] group-hover/img:scale-110 transition-transform" />
              <span className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-subtle)' }}>CatalogIQ</span>
            </div>
          )}

          {/* Active Status Badge in Top-Right Corner */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border ${
                isActive
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)] shadow-sm'
                  : 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-[var(--success)] shadow-[0_0_6px_var(--glow)]' : 'bg-[var(--danger)]'
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
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] font-medium"
                title="Admin Privileges: Full rights to modify or delete this item"
              >
                <Shield className="w-2.5 h-2.5 text-[var(--accent)]" />
                <span>Admin Rights</span>
              </span>
            ) : !canEdit ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border text-[var(--text-subtle)] font-medium"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderColor: 'var(--border)',
                }}
                title={`Created by ${product.created_by_email || 'Admin'}. Read-only for standard users.`}
              >
                <Lock className="w-2.5 h-2.5 text-[var(--text-subtle)]" />
                <span>Read-Only</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand-text)] font-medium"
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
          className="font-semibold text-base leading-snug hover:text-[var(--accent)] transition-colors cursor-pointer line-clamp-2"
          style={{ color: 'var(--text)' }}
        >
          {product.name}
        </h3>

        {product.sku && (
          <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-subtle)' }}>
            SKU: {product.sku}
          </p>
        )}

        {/* Description snippet */}
        <p className="text-xs mt-2.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {product.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-3">
            {product.tags.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-muted)]"
              >
                #{t}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Price, Stock & Actions */}
      <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
        <div>
          <span className="text-[11px] block" style={{ color: 'var(--text-subtle)' }}>Price</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              ₹{parseFloat(product.price || 0).toFixed(2)}
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-subtle)' }}>
              ({product.stock ?? 0} in stock)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onView(product)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
            title="View details"
            aria-label="View product details"
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
                    ? 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]'
                    : 'text-[var(--text-subtle)] hover:text-[var(--warning-text)] hover:bg-[var(--warning-bg)]'
                }`}
                title={
                  canEdit
                    ? isAdmin
                      ? 'Admin: Edit product (Full Rights)'
                      : 'Edit your product'
                    : `Read-only: Created by ${product.created_by_email || 'Admin'}`
                }
                aria-label="Edit product"
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
                className="p-1.5 rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
                title={
                  canEdit
                    ? isAdmin
                      ? 'Admin: Delete product (Full Rights)'
                      : 'Delete your product'
                    : `Read-only: Created by ${product.created_by_email || 'Admin'}`
                }
                aria-label="Delete product"
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
