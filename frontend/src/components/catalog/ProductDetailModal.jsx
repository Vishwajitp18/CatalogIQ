import React from 'react'
import { Edit3, Trash2, Calendar, PackageCheck, Layers, Lock, Shield, User } from 'lucide-react'
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
  const { isAuthenticated, isAdmin } = useAuth()
  if (!product) return null

  const isActive = product.is_active !== false
  const canEdit = product.can_edit !== false

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
        {/* Role & Access Rights Banner */}
        {isAuthenticated && (
          isAdmin ? (
            <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-strong)] text-xs flex items-center justify-between gap-3 text-[var(--accent)]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span>
                  Admin Privileges: You have full rights to edit, update, or soft-delete this product.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shrink-0">
                Admin Full Access
              </span>
            </div>
          ) : !canEdit ? (
            <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs flex items-center justify-between gap-3 text-amber-300">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Read-Only: Created by <strong className="text-amber-200">{product.created_by_email || 'admin@catalogiq.com'}</strong>. Only the creator or an Administrator can modify it.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 shrink-0">
                Protected
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs flex items-center justify-between gap-3 text-emerald-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Owner Access: You created this item and have full rights to manage it.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 shrink-0">
                Your Item
              </span>
            </div>
          )
        )}

        {/* Product Image Banner */}
        {product.image_url && (
          <div
            className="w-full h-60 rounded-xl overflow-hidden border relative shadow-md"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border)',
            }}
          >
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
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border)',
          }}
        >
          <div>
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Price</span>
            <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
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
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            Description
          </h4>
          <p
            className="text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {product.description || 'No description provided.'}
          </p>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[var(--border)]" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[var(--accent)]" />
            <span>Stock: {product.stock ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Added: {new Date(product.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="truncate" title={product.created_by_email}>
              By: {product.created_by_email?.split('@')[0] || 'admin'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>ID: {product.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
