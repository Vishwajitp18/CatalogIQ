import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BrandLogo } from '../../components/brand/BrandLogo'

export const RegisterPage = () => {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth()
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

  const redirectState = useMemo(() => {
    return location.state?.openCreate || targetFrom?.state?.openCreate
      ? { openCreate: true }
      : targetFrom?.state || undefined
  }, [location.state?.openCreate, targetFrom?.state])

  const noticeMessage =
    location.state?.message ||
    (redirectParam ? 'Please create an account to access the requested page.' : null)

  const [fullName, setFullName] = useState('')
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, fullName)
      navigate(redirectDestination, { replace: true, state: redirectState })
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Registration failed. Please check your details.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md relative z-10">
        <BentoCard highlight glowing className="p-7 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" showText={false} asLink={false} className="mb-4" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Create an account
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Join CatalogIQ to supercharge your product workflows
            </p>
          </div>

          {/* Contextual Notice Banner */}
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

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              autoFocus
              icon={User}
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="At least 8 characters"
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
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Already have an account? </span>
            <Link
              to="/login"
              state={location.state}
              className="font-medium text-[var(--accent)] hover:underline ml-1"
            >
              Sign in
            </Link>
          </div>
        </BentoCard>
      </div>
    </div>
  )
}
