import React, { useState, useEffect } from 'react'
import { Sparkles, Plus, X, AlertCircle, Wand2, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { catalogApi, aiApi } from '../../api/client'

export const ProductFormModal = ({
  isOpen,
  onClose,
  product = null,
  brands = [],
  categories = [],
  onSaved,
  onRefreshMetadata,
}) => {
  const isEditing = Boolean(product?.id)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
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
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to create brand.')
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
      setError(err.response?.data?.errors?.[0]?.message || 'Failed to create category.')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setSku(product.sku || '')
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
      setBrandId(brands[0]?.id || '')
      setCategoryId(categories[0]?.id || '')
      setPrice('')
      setStock('10')
      setIsActive(true)
      setDescription('')
      setTags([])
      setBullets('')
    }
    setError('')
    setAiSuccessMessage('')
  }, [product, brands, categories, isOpen])

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

    setError('')
    setIsGeneratingAi(true)
    setAiSuccessMessage('')

    try {
      const data = await aiApi.generateDescription({
        name,
        brand: brandObj?.name || '',
        category: categoryObj?.name || '',
        bullet_points: bullets,
        tone: tone.toLowerCase(),
      })

      if (data.description) {
        setDescription(data.description)
      }
      if (data.tags && Array.isArray(data.tags)) {
        // Merge without duplicates
        const merged = Array.from(new Set([...tags, ...data.tags]))
        setTags(merged)
      }

      setAiSuccessMessage('✨ AI drafted marketing description and extracted SEO tags!')
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.message ||
          'Failed to generate description with AI. Please check server logs.'
      )
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        brand_id: brandId || null,
        category_id: categoryId || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        is_active: isActive,
        description: description.trim(),
        tags,
      }

      if (isEditing) {
        await catalogApi.updateProduct(product.id, payload)
      } else {
        await catalogApi.createProduct(payload)
      }

      onSaved()
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.detail ||
        'Failed to save product. Please verify all fields.'
      setError(msg)
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
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {aiSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-purple-400" />
            <span>{aiSuccessMessage}</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Brand
              </label>
              <button
                type="button"
                onClick={() => setShowNewBrandInput(!showNewBrandInput)}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
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
                  className="w-full rounded-xl glass-input px-3 py-2 text-xs"
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
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm bg-slate-900 text-slate-200 border border-white/10"
              >
                <option value="">No Brand Selected</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
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
                  className="w-full rounded-xl glass-input px-3 py-2 text-xs"
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
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm bg-slate-900 text-slate-200 border border-white/10"
              >
                <option value="">No Category Selected</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Price (USD) *"
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
        </div>

        {/* AI Copywriter Studio Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                AI Copywriter Studio (Groq Qwen 27B)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="text-xs rounded-lg glass-input px-2 py-1 bg-slate-900 border-white/10 text-slate-300"
              >
                <option value="Professional">Tone: Professional</option>
                <option value="Energetic">Tone: Energetic</option>
                <option value="Minimalist">Tone: Minimalist</option>
                <option value="Luxury">Tone: Luxury</option>
              </select>

              <Button
                type="button"
                variant="ai"
                size="sm"
                icon={Wand2}
                isLoading={isGeneratingAi}
                onClick={handleGenerateAiDescription}
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
            className="w-full rounded-xl glass-input px-3.5 py-2 text-xs placeholder-slate-500 bg-slate-950/60"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Marketing Description
          </label>
          <textarea
            rows="4"
            placeholder="Rich product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm placeholder-slate-500"
          />
        </div>

        {/* Tags management */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
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
              className="w-full rounded-xl glass-input px-3.5 py-2 text-xs placeholder-slate-500"
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
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t, idx) => (
                <Badge key={idx} variant="ai" className="gap-1 pr-1.5">
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Active status */}
        <div className="flex items-center gap-2 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-slate-900 border-white/20 text-purple-600 focus:ring-purple-500/30"
            />
            <span>Active listing (visible in public catalog)</span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
