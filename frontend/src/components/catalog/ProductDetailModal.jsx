import React from 'react'
import { Edit3, Trash2, Calendar, PackageCheck, Layers } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
}) => {
  const { isAuthenticated } = useAuth()
  if (!product) return null

  const isActive = product.is_active !== false

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`SKU: ${product.sku || 'N/A'}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="w-full flex items-center justify-between">
          {isAuthenticated ? (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to soft delete "${product.name}"?`
                  )
                ) {
                  onDelete(product.id)
                  onClose()
                }
              }}
            >
              Delete Product
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={() => {
                  onClose()
                  onEdit(product)
                }}
              >
                Edit Product
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Product Image Banner */}
        {product.image_url && (
          <div className="w-full h-60 rounded-2xl overflow-hidden bg-slate-900/90 border border-white/10 relative shadow-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Top Price & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div>
            <span className="text-xs text-slate-400">Price</span>
            <div className="text-3xl font-bold text-white tabular-nums">
              ₹{parseFloat(product.price || 0).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <Badge variant="brand">{product.brand.name}</Badge>
            )}
            {product.category && (
              <Badge variant="ai">{product.category.name}</Badge>
            )}
            <Badge variant={isActive ? 'success' : 'danger'}>
              {isActive ? 'Active' : 'Inactive / Soft Deleted'}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-white/[0.05]">
            {product.description || 'No description provided.'}
          </p>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Tags & Keywords
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t, idx) => (
                <Badge key={idx} variant="ai">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Meta Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-purple-400" />
            <span>Stock: {product.stock ?? 0} units</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>
              Added: {new Date(product.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>ID: {product.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
