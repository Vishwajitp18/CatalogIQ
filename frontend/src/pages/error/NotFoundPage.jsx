import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center">
        <BentoCard highlight glowing className="p-8 space-y-5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)]">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-[var(--accent)]">
              404
            </span>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Page not found
            </h1>
            <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The page or resource you are looking for does not exist or has been relocated in the catalog.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link to="/">
              <Button variant="primary" size="md" icon={ArrowLeft}>
                Return to Catalog
              </Button>
            </Link>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}
