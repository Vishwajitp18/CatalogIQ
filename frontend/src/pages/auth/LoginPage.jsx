import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight, KeyRound, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BrandLogo } from '../../components/brand/BrandLogo'

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Calculate redirect destination from state or search param (?redirect=... or ?next=...)
  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect') || searchParams.get('next')

  const targetFrom = location.state?.from
  let redirectDestination = '/'
  if (typeof targetFrom === 'string') {
    redirectDestination = targetFrom
  } else if (targetFrom?.pathname) {
    redirectDestination =
      targetFrom.pathname + (targetFrom.search || '') + (targetFrom.hash || '')
  } else if (redirectParam) {
    redirectDestination = redirectParam
  }

  // Preserve modal opening or special states
  const redirectState = useMemo(() => {
    return location.state?.openCreate || targetFrom?.state?.openCreate
      ? { openCreate: true }
      : targetFrom?.state || undefined
  }, [location.state?.openCreate, targetFrom?.state])

  const noticeMessage =
    location.state?.message ||
    (redirectParam ? 'Please sign in to access the requested page.' : null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(redirectDestination, { replace: true, state: redirectState })
    }
  }, [isAuthenticated, authLoading, navigate, redirectDestination, redirectState])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate(redirectDestination, { replace: true, state: redirectState })
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.detail ||
        'Invalid email or password. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillAdmin = () => {
    setEmail('admin@catalogiq.com')
    setPassword('AdminPass123!')
    setError('')
  }

  const handleFillUser = () => {
    setEmail('user@catalogiq.com')
    setPassword('UserPass123!')
    setError('')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md relative z-10">
        <BentoCard highlight glowing className="p-7 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" showText={false} asLink={false} className="mb-4" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Sign in to manage and enrich your product catalog
            </p>
          </div>

          {/* Contextual Notice Banner (when redirected from a protected route or expired session) */}
          {noticeMessage && (
            <div
              className="mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              <ShieldAlert className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-[var(--accent)]">Authentication Required: </span>
                <span>{noticeMessage}</span>
              </div>
            </div>
          )}

          {/* Quick Demo Login Pills */}
          <div
            className="mb-6 p-3.5 rounded-xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--surface-muted)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--accent)' }}>
              <div className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Quick Role Demo Logins</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>1-click fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold transition-all shadow-sm group"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
                title="Admin: All rights across the catalog"
              >
                <span>👑 Admin</span>
              </button>
              <button
                type="button"
                onClick={handleFillUser}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all shadow-sm group"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                title="Standard User: Owns only their products, read-only on others"
              >
                <span>👤 Standard User</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoFocus
              icon={Mail}
              placeholder="e.g. admin@catalogiq.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={ArrowRight}
                className="w-full justify-center"
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Don't have an account yet? </span>
            <Link
              to="/register"
              state={location.state}
              className="font-medium text-[var(--accent)] hover:underline ml-1"
            >
              Create account
            </Link>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}
