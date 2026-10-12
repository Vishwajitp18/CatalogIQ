import React, { useState, useEffect, useCallback } from 'react'
import {
  Grid,
  List,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { catalogApi, aiApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { CatalogStats } from '../../components/catalog/CatalogStats'
import { CatalogFilters } from '../../components/catalog/CatalogFilters'
import { ProductCard } from '../../components/catalog/ProductCard'
import { AiSearchBar } from '../../components/ai/AiSearchBar'
import { ProductDetailModal } from '../../components/catalog/ProductDetailModal'
import { ProductFormModal } from '../../components/catalog/ProductFormModal'

export const CatalogPage = ({ isCreateOpen = false, onCloseCreate }) => {
  const { isAuthenticated } = useAuth()

  // Catalog State
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
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

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Load Brands and Categories once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [bData, cData] = await Promise.all([
          catalogApi.getBrands(),
          catalogApi.getCategories(),
        ])
        setBrands(bData)
        setCategories(cData)
      } catch (err) {
        console.warn('Metadata fetch failed:', err)
      }
    }
    fetchMetadata()
  }, [])

  // Fetch standard catalog
  const fetchCatalog = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true)
        const params = {
          page,
          page_size: 12,
          ordering: filters.ordering,
        }
        if (filters.search) params.search = filters.search
        if (filters.brand) params.brand = filters.brand
        if (filters.category) params.category = filters.category
        if (filters.min_price) params.min_price = filters.min_price
        if (filters.max_price) params.max_price = filters.max_price
        if (filters.is_active) params.is_active = filters.is_active

        const data = await catalogApi.getProducts(params)
        setProducts(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(data.total_pages || 1)
        setCurrentPage(data.current_page || page)
      } catch (err) {
        console.error('Failed to load products:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [filters]
  )

  // Effect to load products when filters change (if not in AI mode)
  useEffect(() => {
    if (!isAiActive) {
      fetchCatalog(1)
    }
  }, [filters, isAiActive, fetchCatalog])

  // Handle AI Search Execution
  const handleAiSearch = async (query) => {
    try {
      setAiLoading(true)
      setAiQuery(query)
      setIsAiActive(true)

      const data = await aiApi.search({
        query,
        page: 1,
        page_size: 12,
      })

      setProducts(data.results || [])
      setTotalCount(data.total_count || 0)
      setTotalPages(data.total_pages || 1)
      setCurrentPage(data.page || 1)
      setAiInterpretation(data.interpretation || null)
    } catch (err) {
      console.error('AI Search failed:', err)
    } finally {
      setAiLoading(false)
    }
  }

  // Clear AI Search & revert to standard catalog
  const handleClearAiSearch = () => {
    setIsAiActive(false)
    setAiInterpretation(null)
    setAiQuery('')
    fetchCatalog(1)
  }

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleResetFilters = () => {
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
      if (isAiActive) {
        handleAiSearch(aiQuery)
      } else {
        fetchCatalog(currentPage)
      }
    } catch (_err) {
      alert('Failed to delete product. Please try again.')
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
                        <td className="p-3.5 font-medium text-white max-w-xs truncate">
                          {p.name}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {p.brand?.name || '—'}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {p.category?.name || '—'}
                        </td>
                        <td className="p-3.5 font-semibold text-white tabular-nums">
                          ${parseFloat(p.price || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-slate-400 tabular-nums">
                          {p.stock ?? 0}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              p.is_active ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                          />
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="text-slate-400 hover:text-white px-2 py-1 rounded"
                          >
                            View
                          </button>
                          {isAuthenticated && (
                            <button
                              onClick={() => {
                                setEditingProduct(p)
                                setIsFormOpen(true)
                              }}
                              className="text-purple-400 hover:text-purple-300 px-2 py-1 rounded"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => fetchCatalog(currentPage - 1)}
                  icon={ChevronLeft}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => fetchCatalog(currentPage + 1)}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
          if (onCloseCreate) onCloseCreate()
        }}
        product={editingProduct}
        brands={brands}
        categories={categories}
        onSaved={() => {
          if (isAiActive) {
            handleAiSearch(aiQuery)
          } else {
            fetchCatalog(currentPage)
          }
        }}
      />
    </div>
  )
}
