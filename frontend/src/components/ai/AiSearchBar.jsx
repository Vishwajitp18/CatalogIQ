import React, { useState } from 'react'
import { Sparkles, ArrowRight, X, Cpu, Tag, IndianRupee, BrainCircuit } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export const AiSearchBar = ({
  onSearch,
  onClear,
  isLoading = false,
  interpretation = null,
  _activeQuery = '',
}) => {
  const [query, setQuery] = useState('')

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
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-violet-500/40 via-purple-500/20 to-cyan-500/40 focus-within:from-violet-500 focus-within:to-cyan-400 shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
          <div className="relative flex items-center bg-slate-950/90 rounded-[15px] px-4 py-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mr-2 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <input
              type="text"
              placeholder="Ask in natural language (e.g., 'Find running shoes from Nike under ₹3000')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-slate-500 hover:text-white mr-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <Button
              type="submit"
              variant="ai"
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
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            Try prompts:
          </span>
          {suggestions.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(sample)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
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

        return (
          <div className="rounded-2xl p-5 bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-cyan-950/30 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.12)] space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  Groq Qwen 27B Query Interpretation
                </span>
              </div>

              <button
                type="button"
                onClick={onClear}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
                Exit AI Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {brandLabel && (
                <Badge variant="brand" className="gap-1">
                  <Tag className="w-3 h-3" />
                  Brand: <strong className="text-white">{brandLabel}</strong>
                </Badge>
              )}

              {categoryLabel && (
                <Badge variant="ai" className="gap-1">
                  Category: <strong className="text-white">{categoryLabel}</strong>
                </Badge>
              )}

              {(interpretation.min_price != null || interpretation.max_price != null) && (
                <Badge variant="success" className="gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Price:
                  <strong className="text-white">
                    {interpretation.min_price != null ? `₹${interpretation.min_price}` : '₹0'}
                    {' - '}
                    {interpretation.max_price != null ? `₹${interpretation.max_price}` : 'No limit'}
                  </strong>
                </Badge>
              )}

              {terms.length > 0 && (
                <Badge variant="neutral" className="gap-1">
                  Keywords: {terms.join(', ')}
                </Badge>
              )}

              {interpretation.sort_by && (
                <Badge variant="neutral" className="gap-1">
                  Sort: {interpretation.sort_by}
                </Badge>
              )}
            </div>

            {notes.length > 0 && (
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                {notes.map((note, idx) => (
                  <p key={idx} className="italic text-slate-300">
                    ℹ️ {note}
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

