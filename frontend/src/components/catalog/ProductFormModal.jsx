import React, { useState, useEffect } from 'react'
import { Sparkles, Plus, X, AlertCircle, Wand2, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { catalogApi, aiApi } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { parseApiError } from '../../utils/errorParser'

export const ProductFormModal = ({
  isOpen,
  onClose,
  product = null,
  brands = [],
  categories = [],
  onSaved,
  onRefreshMetadata,
}) => {
  const { showError, showSuccess } = useToast()
  const isEditing = Boolean(product?.id)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')

  // Quick brand & category creation
  const [showNewBrandInput, setShowNewBrandInput] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // AI draft helpers
  const [bullets, setBullets] = useState('')
  const [tone, setTone] = useState('Professional')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSuccessMessage, setAiSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return
    setIsCreatingBrand(true)
    setError('')
    try {
      const created = await catalogApi.createBrand({ name: newBrandName.trim() })
      if (onRefreshMetadata) await onRefreshMetadata()
      setBrandId(created.id)
      setNewBrandName('')
      setShowNewBrandInput(false)
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to create brand.')
      setError(parsed.message)
    } finally {
      setIsCreatingBrand(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsCreatingCategory(true)
    setError('')
    try {
      const created = await catalogApi.createCategory({ name: newCategoryName.trim() })
      if (onRefreshMetadata) await onRefreshMetadata()
      setCategoryId(created.id)
      setNewCategoryName('')
      setShowNewCategoryInput(false)
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to create category.')
      setError(parsed.message)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setSku(product.sku || '')
      setImageUrl(product.image_url || '')
      setBrandId(product.brand?.id || '')
      setCategoryId(product.category?.id || '')
      setPrice(product.price ? String(product.price) : '')
      setStock(product.stock != null ? String(product.stock) : '0')
      setIsActive(product.is_active ?? true)
      setDescription(product.description || '')
      setTags(product.tags || [])
      setBullets('')
    } else {
      setName('')
      setSku('')
      setImageUrl('')
      setBrandId('')
      setCategoryId('')
      setPrice('')
      setStock('0')
      setIsActive(true)
      setDescription('')
      setTags([])
      setBullets('')
    }
    setError('')
    setAiSuccessMessage('')
  }, [product, isOpen])

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleGenerateAiDescription = async () => {
    if (!name.trim()) {
      setError('Please provide at least a Product Name before generating copy.')
      return
    }

    const brandObj = brands.find((b) => b.id === brandId)
    const categoryObj = categories.find((c) => c.id === categoryId)

    const keyFeatures = bullets
      .split(/[\n,]+/)
      .map((s) => s.replace(/^[-•* \t]+/, '').trim())
      .filter(Boolean)
      .slice(0, 10)

    setError('')
    setIsGeneratingAi(true)
    setAiSuccessMessage('')

    try {
      const data = await aiApi.generateDescription({
        name: name.trim(),
        brand: brandObj?.name || 'Catalog Item',
        category: categoryObj?.name || 'General',
        key_features: keyFeatures,
        bullet_points: bullets.trim(),
        tone: tone.toLowerCase(),
      })

      if (data.description) {
        setDescription(data.description)
      }
      if (data.tags && Array.isArray(data.tags)) {
        const merged = Array.from(new Set([...tags, ...data.tags]))
        setTags(merged)
      }

      setAiSuccessMessage(
        `AI drafted ${tone} marketing description and extracted ${data.tags?.length || 0} SEO tags!`
      )
      showSuccess(`AI drafted ${tone} description and extracted ${data.tags?.length || 0} SEO tags!`)
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to generate description with AI.')
      setError(parsed.message)
      showError(err, 'AI Copywriter Error')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please provide a product name.')
      return
    }

    if (!brandId) {
      setError('Please select a brand for this product.')
      return
    }

    if (!categoryId) {
      setError('Please select a category for this product.')
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        image_url: imageUrl.trim() || '',
        brand_id: brandId,
        category_id: categoryId,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        is_active: isActive,
        description: description.trim(),
        tags,
      }

      if (isEditing) {
        await catalogApi.updateProduct(product.id, payload)
        showSuccess(`"${name.trim()}" updated successfully.`)
      } else {
        await catalogApi.createProduct(payload)
        showSuccess(`"${name.trim()}" created successfully.`)
      }

      onSaved()
      onClose()
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save product.')
      setError(parsed.message)
      showError(err, isEditing ? 'Failed to Update Product' : 'Failed to Create Product')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      subtitle={
        isEditing
          ? 'Update product details or enhance copy with AI'
          : 'Create a catalog item with AI-powered copy drafting'
      }
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="primary"
            size="sm"
            isLoading={isSaving}
          >
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-[var(--danger-text)] shrink-0 mt-0.5" />
            <div className="flex-1 whitespace-pre-line leading-relaxed font-normal">{error}</div>
          </div>
        )}

        {aiSuccessMessage && (
          <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{aiSuccessMessage}</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Product Name *"
            required
            placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="SKU (Stock Keeping Unit)"
            placeholder="Auto-generated if empty"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />

          {/* Brand select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Brand
              </label>
              <button
                type="button"
                onClick={() => setShowNewBrandInput(!showNewBrandInput)}
                className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
              >
                {showNewBrandInput ? 'Cancel' : '+ New Brand'}
              </button>
            </div>

            {showNewBrandInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New brand name (e.g. Dyson)..."
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full rounded-xl theme-input px-3 py-2 text-xs"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isCreatingBrand}
                  onClick={handleCreateBrand}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Select
                id="brand-select"
                value={brandId}
                onChange={(val) => setBrandId(val)}
                placeholder="No Brand Selected"
                options={[
                  { value: '', label: 'No Brand Selected' },
                  ...brands.map((b) => ({ value: String(b.id), label: b.name })),
                ]}
              />
            )}
          </div>

          {/* Category select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
              >
                {showNewCategoryInput ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            {showNewCategoryInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name (e.g. Wearables)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl theme-input px-3 py-2 text-xs"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isCreatingCategory}
                  onClick={handleCreateCategory}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Select
                id="category-select"
                value={categoryId}
                onChange={(val) => setCategoryId(val)}
                placeholder="No Category Selected"
                options={[
                  { value: '', label: 'No Category Selected' },
                  ...categories.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />
            )}
          </div>

          <Input
            label="Price (INR ₹) *"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <Input
            label="Inventory Stock"
            type="number"
            min="0"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Input
              label="Image URL"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div
                className="mt-2 flex items-center gap-3 p-2 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderColor: 'var(--border)',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-[var(--border)]"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  Image preview attached
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Copywriter Studio Box */}
        <div
          className="p-3.5 rounded-2xl border space-y-2.5"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                AI Copywriter Studio (Groq Qwen 27B)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                size="sm"
                value={tone}
                onChange={(val) => setTone(val)}
                className="w-36 sm:w-40 shrink-0"
                options={[
                  { value: 'Professional', label: 'Tone: Professional' },
                  { value: 'Friendly', label: 'Tone: Friendly' },
                  { value: 'Technical', label: 'Tone: Technical' },
                  { value: 'Energetic', label: 'Tone: Energetic' },
                  { value: 'Minimalist', label: 'Tone: Minimalist' },
                  { value: 'Luxury', label: 'Tone: Luxury' },
                ]}
              />

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Wand2}
                isLoading={isGeneratingAi}
                onClick={handleGenerateAiDescription}
                className="shrink-0 whitespace-nowrap h-[32px]"
              >
                Draft with AI
              </Button>
            </div>
          </div>

          <textarea
            rows="2"
            placeholder="Optional raw feature bullets (e.g. '30-hour battery, active noise cancellation, lightweight foldable frame')..."
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            className="w-full rounded-xl theme-input px-3 py-1.5 text-xs bg-[var(--input-bg)] text-[var(--text)]"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-1">
          <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Marketing Description
          </label>
          <textarea
            rows="3"
            placeholder="Rich product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl theme-input px-3 py-2 text-xs leading-relaxed"
          />
        </div>

        {/* Tags management */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Product Tags
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g., wireless, bluetooth)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="w-full rounded-xl theme-input px-3 py-1.5 text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddTag}
            >
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {tags.map((t, idx) => (
                <Badge key={idx} variant="ai" className="gap-1 pr-1.5 text-[11px] py-0.5">
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:opacity-75"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Active status */}
        <div className="pt-1">
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
            <label className="flex items-center gap-2.5 text-xs cursor-pointer select-none" style={{ color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded w-4 h-4 accent-[var(--accent)] border-[var(--border)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <span className="font-medium">Active listing (visible in public catalog)</span>
            </label>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isActive
                ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
            }`}>
              {isActive ? 'Active' : 'Draft / Inactive'}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
