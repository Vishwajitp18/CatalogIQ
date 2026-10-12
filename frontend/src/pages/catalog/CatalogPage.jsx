import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Grid,
  List,
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  CheckCircle2,
} from 'lucide-react'
import { catalogApi, aiApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { CatalogStats } from '../../components/catalog/CatalogStats'
import { CatalogFilters } from '../../components/catalog/CatalogFilters'
import { ProductCard } from '../../components/catalog/ProductCard'
import { AiSearchBar } from '../../components/ai/AiSearchBar'
import { ProductDetailModal } from '../../components/catalog/ProductDetailModal'
import { ProductFormModal } from '../../components/catalog/ProductFormModal'

export const CatalogPage = ({ isCreateOpen = false, onCloseCreate }) => {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const { showError, showSuccess, showWarning, showInfo } = useToast()


  // Catalog State
  const PAGE_SIZE = 12
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const sentinelRef = useRef(null)
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])

  // Filter & Search State
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    category: '',
    min_price: '',
    max_price: '',
    is_active: 'true',
    ordering: '-created_at',
  })
  const [viewMode, setViewMode] = useState('grid')
  const [isLoading, setIsLoading] = useState(true)

  // AI Search State
  const [isAiActive, setIsAiActive] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiQuery, setAiQuery] = useState('')

  const location = useLocation()

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Sync external create product trigger (from Navbar across routes or prop)
  useEffect(() => {
    if (isCreateOpen || location.state?.openCreate) {
      setEditingProduct(null)
      setIsFormOpen(true)
      if (location.state?.openCreate) {
        window.history.replaceState({}, document.title)
      }
    }
  }, [isCreateOpen, location.state])

  // Load Brands and Categories
  const fetchMetadata = useCallback(async () => {
    try {
      const [bData, cData] = await Promise.all([
        catalogApi.getBrands(),
        catalogApi.getCategories(),
      ])
      setBrands(bData)
      setCategories(cData)
    } catch (err) {
      console.warn('Metadata fetch failed:', err)
      showError(err, 'Failed to Load Catalog Categories')
    }
  }, [showError])

  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

  // Track window scroll for Back to Top floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch standard catalog with optional append mode (for infinite scroll)
  const fetchCatalog = useCallback(
    async (page = 1, append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
        }

        const params = {
          page,
          page_size: PAGE_SIZE,
          ordering: filters.ordering,
        }
        if (filters.search) params.search = filters.search
        if (filters.brand) params.brand = filters.brand
        if (filters.category) params.category = filters.category
        if (filters.min_price) params.min_price = filters.min_price
        if (filters.max_price) params.max_price = filters.max_price
        if (filters.is_active) params.is_active = filters.is_active

        const data = await catalogApi.getProducts(params)
        const incoming = data.results || []

        if (append) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const uniqueIncoming = incoming.filter((p) => !existingIds.has(p.id))
            return [...prev, ...uniqueIncoming]
          })
        } else {
          setProducts(incoming)
        }

        const count = data.count ?? incoming.length
        setTotalCount(count)
        setTotalPages(data.total_pages || Math.ceil(count / PAGE_SIZE) || 1)
        setCurrentPage(data.current_page || page)
      } catch (err) {
        console.error('Failed to load products:', err)
        showError(err, 'Failed to Load Products')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [filters, showError]
  )

  // Effect to load products when filters change (if not in AI mode)
  useEffect(() => {
    if (!isAiActive) {
      fetchCatalog(1, false)
    }
  }, [filters, isAiActive, fetchCatalog])

  // IntersectionObserver for Infinite Continuous Scroll
  useEffect(() => {
    if (isAiActive) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (
          target.isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          currentPage < totalPages &&
          products.length < totalCount
        ) {
          fetchCatalog(currentPage + 1, true)
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
    }
  }, [
    isAiActive,
    isLoading,
    isLoadingMore,
    currentPage,
    totalPages,
    products.length,
    totalCount,
    fetchCatalog,
  ])

  const [aiNotification, setAiNotification] = useState(null)

  // Handle AI Search Execution
  const handleAiSearch = async (query) => {
    setAiNotification(null)

    if (!isAuthenticated) {
      setAiNotification({
        type: 'warning',
        message:
          'Please sign in to use Natural Language AI search. You can click "Fill Demo" on the Login page for 1-click access!',
      })
      // Fallback: search via standard keyword search
      handleFilterChange({ search: query })
      return
    }

    try {
      setAiLoading(true)
      setAiQuery(query)
      setIsAiActive(true)

      const data = await aiApi.search({
        query,
        limit: 20,
      })

      setProducts(data.results || [])
      setTotalCount(data.count ?? data.total_count ?? (data.results?.length || 0))
      setTotalPages(1)
      setCurrentPage(1)
      setAiInterpretation(data.interpretation || null)
    } catch (err) {
      console.warn('AI Search notice:', err)
      const statusCode = err.response?.status
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || ''
      if (statusCode === 401) {
        setAiNotification({
          type: 'warning',
          message: 'Your session has expired. Please sign in to run AI searches.',
        })
      } else {
        setAiNotification({
          type: 'info',
          message: `AI inference service note: ${msg || 'Code ' + statusCode}. Switched to keyword search for "${query}".`,
        })
      }
      setIsAiActive(false)
      handleFilterChange({ search: query })
    } finally {
      setAiLoading(false)
    }
  }

  // Clear AI Search & revert to standard catalog
  const handleClearAiSearch = () => {
    setIsAiActive(false)
    setAiInterpretation(null)
    setAiQuery('')
    setAiNotification(null)
    fetchCatalog(1, false)
  }

  const handleFilterChange = (newFilters) => {
    if (isAiActive) {
      setIsAiActive(false)
      setAiInterpretation(null)
      setAiQuery('')
      setAiNotification(null)
    }
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleResetFilters = () => {
    if (isAiActive) {
      setIsAiActive(false)
      setAiInterpretation(null)
      setAiQuery('')
      setAiNotification(null)
    }
    setFilters({
      search: '',
      brand: '',
      category: '',
      min_price: '',
      max_price: '',
      is_active: 'true',
      ordering: '-created_at',
    })
  }

  const handleDeleteProduct = async (id) => {
    try {
      await catalogApi.deleteProduct(id)
      showSuccess('Product removed from catalog.')
      if (isAiActive) {
        handleAiSearch(aiQuery)
      } else {
        fetchCatalog(1, false)
      }
    } catch (err) {
      showError(err, 'Failed to Delete Product')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero & AI Search Banner */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 overflow-hidden bento-highlight">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Product Intelligence with Groq Qwen 27B</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent E-Commerce Catalog & Natural Search
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            Query across multi-attribute products using conversational intent, or let AI draft rich product marketing copy and SEO tags in seconds.
          </p>

          <div className="pt-2">
            {aiNotification && (
              <div
                className={`mb-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                  aiNotification.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    : 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                }`}
              >
                <span>{aiNotification.message}</span>
                <button
                  type="button"
                  onClick={() => setAiNotification(null)}
                  className="text-xs hover:underline opacity-80 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
            <AiSearchBar
              onSearch={handleAiSearch}
              onClear={handleClearAiSearch}
              isLoading={aiLoading}
              interpretation={aiInterpretation}
              activeQuery={aiQuery}
            />
          </div>
        </div>
      </div>

      {/* Bento Stats Summary Row */}
      <CatalogStats
        products={products}
        totalCount={totalCount}
        brands={brands}
        categories={categories}
      />

      {/* Main Grid & Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <CatalogFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            brands={brands}
            categories={categories}
            isAiActive={isAiActive}
          />
        </div>

        {/* Right Product Grid/Table Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {isAiActive ? 'AI Search Results' : 'Catalog Products'}
              </span>
              <span className="text-xs text-slate-400">({totalCount} found)</span>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {isAuthenticated && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setEditingProduct(null)
                    setIsFormOpen(true)
                  }}
                >
                  New Product
                </Button>
              )}
            </div>
          </div>

          {/* Product Items */}
          {isLoading || aiLoading ? (
            <div className="p-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
              <p className="text-sm">Fetching catalog products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-card border border-white/[0.08] space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-white">
                No products match this query
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try widening your price range, selecting different categories, or resetting the search filter.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={isAiActive ? handleClearAiSearch : handleResetFilters}
              >
                Reset Search
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onView={setSelectedProduct}
                  onEdit={(prod) => {
                    setEditingProduct(prod)
                    setIsFormOpen(true)
                  }}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-2xl glass-card overflow-hidden border border-white/[0.08]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3.5 font-medium">Product</th>
                      <th className="p-3.5 font-medium">Brand</th>
                      <th className="p-3.5 font-medium">Category</th>
                      <th className="p-3.5 font-medium">Price</th>
                      <th className="p-3.5 font-medium">Stock</th>
                      <th className="p-3.5 font-medium">Status</th>
                      <th className="p-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-3.5 font-medium text-white max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <span className="text-[9px] text-slate-500 font-mono">N/A</span>
                              )}
                            </div>
                            <span className="truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {p.brand?.name || '—'}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {p.category?.name || '—'}
                        </td>
                        <td className="p-3.5 font-semibold text-white tabular-nums">
                          ₹{parseFloat(p.price || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-slate-400 tabular-nums">
                          {p.stock ?? 0}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              p.is_active !== false
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.is_active !== false ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            <span>{p.is_active !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="text-slate-400 hover:text-white px-2 py-1 rounded"
                          >
                            View
                          </button>
                          {isAuthenticated && (() => {
                            const canEdit = p.can_edit ?? (isAdmin || (user && p.created_by_email === user.email))
                            return (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProduct(p)
                                    setIsFormOpen(true)
                                  }}
                                  className={`px-2 py-1 rounded ${
                                    canEdit
                                      ? 'text-purple-400 hover:text-purple-300'
                                      : 'text-slate-500 hover:text-amber-300'
                                  }`}
                                  title={
                                    canEdit
                                      ? isAdmin
                                        ? 'Admin: Edit product (Full Rights)'
                                        : 'Edit your product'
                                      : `Read-only: Created by ${p.created_by_email || 'Admin'}`
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to soft delete "${p.name}"?`)) {
                                      handleDeleteProduct(p.id)
                                    }
                                  }}
                                  className={`px-2 py-1 rounded ${
                                    canEdit
                                      ? 'text-rose-400 hover:text-rose-300'
                                      : 'text-slate-500 hover:text-rose-300'
                                  }`}
                                  title={
                                    canEdit
                                      ? isAdmin
                                        ? 'Admin: Delete product (Full Rights)'
                                        : 'Delete your product'
                                      : `Read-only: Created by ${p.created_by_email || 'Admin'}`
                                  }
                                >
                                  Delete
                                </button>
                              </>
                            )
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Production Scrollable Pagination Sentinel */}
          {!isAiActive && (
            <div className="pt-6 pb-2 flex flex-col items-center justify-center space-y-3">
              {isLoadingMore && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs shadow-lg animate-in fade-in duration-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Loading more products...</span>
                </div>
              )}

              {products.length < totalCount && (
                <div ref={sentinelRef} className="h-10 w-full pointer-events-none" />
              )}

              {products.length >= totalCount && totalCount > 0 && !isLoading && (
                <p className="text-xs text-slate-500 tracking-wide text-center pt-2">
                  Showing all {totalCount} products
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-purple-600/90 hover:bg-purple-500 text-white shadow-xl shadow-purple-950/50 backdrop-blur-md border border-purple-400/30 transition-all duration-300 hover:scale-105 group"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onEdit={(prod) => {
          setEditingProduct(prod)
          setIsFormOpen(true)
        }}
        onDelete={handleDeleteProduct}
      />

      {/* Product Form / AI Copywriter Modal */}
      <ProductFormModal
        isOpen={isFormOpen || isCreateOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingProduct(null)
          if (onCloseCreate) onCloseCreate()
        }}
        product={editingProduct}
        brands={brands}
        categories={categories}
        onRefreshMetadata={fetchMetadata}
        onSaved={() => {
          setIsFormOpen(false)
          setEditingProduct(null)
          if (onCloseCreate) onCloseCreate()
          if (isAiActive) {
            handleAiSearch(aiQuery)
          } else {
            fetchCatalog(1, false)
          }
        }}
      />
    </div>
  )
}
