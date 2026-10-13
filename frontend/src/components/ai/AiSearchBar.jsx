import React, { useState } from 'react'
import { Sparkles, ArrowRight, X, Cpu, Tag, IndianRupee, BrainCircuit, ArrowUpDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

const formatSortLabel = (sortBy) => {
  switch (sortBy) {
    case 'price_asc':
      return 'Price: Low to High'
    case 'price_desc':
      return 'Price: High to Low'
    case 'newest':
      return 'Newest Arrivals'
    case 'name_asc':
      return 'Name: A to Z'
    case 'relevance':
    default:
      return 'Best Match'
  }
}

export const AiSearchBar = ({
  onSearch,
  onClear,
  isLoading = false,
  interpretation = null,
  activeQuery = '',
}) => {
  const [query, setQuery] = useState(activeQuery || '')

  const suggestions = [
    'Nike shoes under ₹3000',
    'Noise canceling headphones',
    'Apple gadgets under ₹50000',
    'Eco-friendly organic cotton apparel',
    'Sony gaming accessories',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query.trim())
  }

  const handleSuggestionClick = (sample) => {
    setQuery(sample)
    onSearch(sample)
  }

  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="relative rounded-2xl p-[1px] transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--border-strong) 0%, var(--accent) 50%, #55D6A4 100%)',
            boxShadow: '0 0 25px var(--glow)',
          }}
        >
          <div
            className="relative flex items-center rounded-[15px] px-3.5 sm:px-4 py-2"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mr-2 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <input
              type="text"
              placeholder="Ask in natural language (e.g., 'Find running shoes from Nike under ₹3000')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base placeholder:text-[var(--text-subtle)] focus:outline-none"
              style={{ color: 'var(--text)' }}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)] mr-2 transition-colors"
                aria-label="Clear AI query input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              icon={ArrowRight}
              className="shrink-0"
            >
              Ask AI
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestion Chips */}
      {!interpretation && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <BrainCircuit className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Try prompts:</span>
          </span>
          {suggestions.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(sample)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
              <span>{sample}</span>
            </button>
          ))}
        </div>
      )}

      {/* AI Semantic Interpretation Breakdown Card */}
      {interpretation && (() => {
        const brandLabel =
          typeof interpretation.brand === 'object' && interpretation.brand !== null
            ? interpretation.brand.name
            : interpretation.brand

        const categoryLabel =
          typeof interpretation.category === 'object' && interpretation.category !== null
            ? interpretation.category.name
            : interpretation.category

        const terms = interpretation.search_terms || interpretation.keywords || []
        const notes = interpretation.notes || []

        const hasSpecificCriteria =
          Boolean(brandLabel) ||
          Boolean(categoryLabel) ||
          terms.length > 0 ||
          interpretation.min_price != null ||
          interpretation.max_price != null

        const displayNotes = [...notes]
        if (!hasSpecificCriteria) {
          displayNotes.unshift(
            `No specific category, brand, or price constraints detected for "${activeQuery || query || 'query'}". Displaying catalog ordered by Best Match.`
          )
        }

        return (
          <div
            className="rounded-2xl p-5 border space-y-3 animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 0 24px var(--glow)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Groq Qwen 27B Query Interpretation
                </span>
              </div>

              <button
                type="button"
                onClick={onClear}
                className="text-xs flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg border hover:border-[var(--accent)]"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit AI Search</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {brandLabel && (
                <Badge variant="brand" className="gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Brand: <strong>{brandLabel}</strong></span>
                </Badge>
              )}

              {categoryLabel && (
                <Badge variant="ai" className="gap-1">
                  <span>Category: <strong>{categoryLabel}</strong></span>
                </Badge>
              )}

              {(interpretation.min_price != null || interpretation.max_price != null) && (
                <Badge variant="success" className="gap-1">
                  <IndianRupee className="w-3 h-3" />
                  <span>
                    Price:
                    <strong>
                      {interpretation.min_price != null ? ` ₹${interpretation.min_price}` : ' ₹0'}
                      {' - '}
                      {interpretation.max_price != null ? `₹${interpretation.max_price}` : 'No limit'}
                    </strong>
                  </span>
                </Badge>
              )}

              {terms.length > 0 && (
                <Badge variant="neutral" className="gap-1">
                  <span>Keywords: {terms.join(', ')}</span>
                </Badge>
              )}

              {interpretation.sort_by && (
                <Badge
                  variant="neutral"
                  className="gap-1.5"
                  title="Products sorted by match relevance and latest arrivals"
                >
                  <ArrowUpDown className="w-3 h-3 text-[var(--accent)]" />
                  <span>
                    Sort: <strong>{formatSortLabel(interpretation.sort_by)}</strong>
                  </span>
                </Badge>
              )}
            </div>

            {displayNotes.length > 0 && (
              <div
                className="text-xs space-y-1.5 pt-2 border-t border-[var(--border)]"
                style={{ color: 'var(--text-muted)' }}
              >
                {displayNotes.map((note, idx) => (
                  <p key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-[var(--accent)] font-semibold shrink-0">ℹ️</span>
                    <span>{note}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
