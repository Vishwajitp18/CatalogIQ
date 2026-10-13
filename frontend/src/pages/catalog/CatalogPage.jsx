import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Grid,
  List,
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowUp,
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
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()

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
  const [stats, setStats] = useState(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

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
  const [aiNotification, setAiNotification] = useState(null)

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

        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE) || 1)
        setCurrentPage(page)
      } catch (err) {
        console.error('Catalog fetch failed:', err)
        showError(err, 'Failed to Load Catalog')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [filters, showError]
  )

  // Dedicated database-aggregated query for Bento summary metrics
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true)
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.brand) params.brand = filters.brand
      if (filters.category) params.category = filters.category
      if (filters.min_price) params.min_price = filters.min_price
      if (filters.max_price) params.max_price = filters.max_price
      if (filters.is_active) params.is_active = filters.is_active

      const data = await catalogApi.getStats(params)
      setStats(data)
    } catch (err) {
      console.warn('Catalog DB stats query failed:', err)
    } finally {
      setIsStatsLoading(false)
    }
  }, [filters])

  // Effect to load products and DB stats when filters change (if not in AI mode)
  useEffect(() => {
    if (!isAiActive) {
      fetchCatalog(1, false)
      fetchStats()
    }
  }, [filters, isAiActive, fetchCatalog, fetchStats])

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

  // Natural Language AI Search Handler
  const handleAiSearch = async (queryText) => {
    if (!queryText.trim()) return

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: location,
          message: 'Please sign in to use AI-powered natural language search.',
        },
      })
      return
    }

    setAiLoading(true)
    setIsAiActive(true)
    setAiQuery(queryText)
    setAiNotification(null)

    try {
      const data = await aiApi.searchNatural(queryText)
      setAiInterpretation(data.interpretation)
      const results = data.results || []
      setProducts(results)
      setTotalCount(results.length)
      setTotalPages(1)
      setCurrentPage(1)

      const notes = data.interpretation?.notes || []
      const hasRelaxationNote = notes.some((n) =>
        /widened|relaxed|relevance|matches found/i.test(n)
      )

      // Calculate context stats for AI search result
      const aiAvg = results.length
        ? (results.reduce((acc, p) => acc + parseFloat(p.price || 0), 0) / results.length).toFixed(2)
        : 0
      const aiTagged = results.filter((p) => p.tags && p.tags.length > 0).length
      const aiBrandCount = new Set(results.map((p) => p.brand?.id || p.brand?.name).filter(Boolean)).size
      const aiCatCount = new Set(results.map((p) => p.category?.id || p.category?.name).filter(Boolean)).size
      setStats({
        total_products: results.length,
        total_brands: aiBrandCount,
        total_categories: aiCatCount,
        avg_price: aiAvg,
        ai_tagged_count: aiTagged,
      })

      if (results.length === 0) {
        setAiNotification({
          type: 'warning',
          message:
            data.interpretation?.notes?.[0] ||
            'No catalog items matched the interpreted criteria.',
        })
      } else if (hasRelaxationNote) {
        setAiNotification({
          type: 'info',
          message: notes[0],
        })
      }
    } catch (err) {
      console.error('AI search failed:', err)
      showError(err, 'AI Natural Query Error')
      setIsAiActive(false)
      fetchCatalog(1, false)
      fetchStats()
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
    fetchStats()
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
        fetchStats()
      }
    } catch (err) {
      showError(err, 'Failed to Delete Product')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero & AI Search Banner */}
      <div
        className="relative rounded-3xl surface-panel p-6 sm:p-8 overflow-hidden emerald-card-highlight border-[var(--border-strong)]"
        style={{
          boxShadow: 'var(--panel-shadow), 0 0 24px var(--glow)',
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Product Intelligence with Groq Qwen 27B</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--text)' }}
          >
            Intelligent E-Commerce Catalog & Natural Search
          </h1>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Query across multi-attribute products using conversational intent, or let AI draft rich product marketing copy and SEO tags in seconds.
          </p>

          <div className="pt-2">
            {aiNotification && (
              <div
                className={`mb-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                  aiNotification.type === 'warning'
                    ? 'bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)]'
                    : 'bg-[var(--accent-soft)] border-[var(--border-strong)] text-[var(--accent)]'
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
        stats={stats}
        isLoading={isStatsLoading}
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
          />
        </div>

        {/* Right Product Grid/Table Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl surface-card">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {isAiActive ? 'AI Search Results' : 'Catalog Products'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({totalCount} found)</span>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div
                className="flex items-center p-1 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderColor: 'var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--border-strong)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  title="Grid View"
                  aria-label="Switch to grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--border-strong)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  title="Table View"
                  aria-label="Switch to table view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login', {
                      state: {
                        from: { pathname: '/', search: '', state: { openCreate: true } },
                        message: 'Please sign in to add a product to the catalog.',
                      },
                    })
                    return
                  }
                  setEditingProduct(null)
                  setIsFormOpen(true)
                }}
              >
                New Product
              </Button>
            </div>
          </div>

          {/* Product Items */}
          {isLoading || aiLoading ? (
            <div className="p-16 text-center" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--accent)]" />
              <p className="text-sm">Fetching catalog products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center rounded-2xl surface-card space-y-3">
              <AlertCircle className="w-8 h-8 text-[var(--text-subtle)] mx-auto" />
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                No products match this query
              </h3>
              <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
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
            <div className="rounded-2xl surface-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className="border-b font-medium"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Brand</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <td className="p-3.5 font-medium max-w-xs" style={{ color: 'var(--text)' }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center"
                              style={{
                                backgroundColor: 'var(--surface-muted)',
                                borderColor: 'var(--border)',
                              }}
                            >
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
                                <span className="text-[9px] font-mono" style={{ color: 'var(--text-subtle)' }}>N/A</span>
                              )}
                            </div>
                            <span className="truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5" style={{ color: 'var(--text-muted)' }}>
                          {p.brand?.name || '—'}
                        </td>
                        <td className="p-3.5" style={{ color: 'var(--text-muted)' }}>
                          {p.category?.name || '—'}
                        </td>
                        <td className="p-3.5 font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          ₹{parseFloat(p.price || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {p.stock ?? 0}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              p.is_active !== false
                                ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                                : 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                p.is_active !== false ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                              }`}
                            />
                            <span>{p.is_active !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(p)}
                            className="text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1 rounded"
                          >
                            View
                          </button>
                          {isAuthenticated && (() => {
                            const canEdit = p.can_edit ?? (isAdmin || (user && p.created_by_email === user.email))
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p)
                                    setIsFormOpen(true)
                                  }}
                                  className={`px-2 py-1 rounded ${
                                    canEdit
                                      ? 'text-[var(--accent)] hover:underline'
                                      : 'text-[var(--text-subtle)] hover:text-[var(--warning-text)]'
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
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to soft delete "${p.name}"?`)) {
                                      handleDeleteProduct(p.id)
                                    }
                                  }}
                                  className={`px-2 py-1 rounded ${
                                    canEdit
                                      ? 'text-[var(--danger-text)] hover:underline'
                                      : 'text-[var(--text-subtle)] hover:text-[var(--danger-text)]'
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)] text-xs shadow-lg animate-in fade-in duration-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
                  <span>Loading more products...</span>
                </div>
              )}

              {products.length < totalCount && (
                <div ref={sentinelRef} className="h-10 w-full pointer-events-none" />
              )}

              {products.length >= totalCount && totalCount > 0 && !isLoading && (
                <p className="text-xs tracking-wide text-center pt-2" style={{ color: 'var(--text-subtle)' }}>
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
          className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xl border border-[var(--accent-pressed)] transition-all duration-200 hover:scale-105 group"
          title="Back to top"
          aria-label="Back to top"
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
            fetchStats()
          }
        }}
      />
    </div>
  )
}
