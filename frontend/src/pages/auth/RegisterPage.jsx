import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BrandLogo } from '../../components/brand/BrandLogo'

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      navigate('/', { replace: true })
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

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
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
