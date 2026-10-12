import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
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
      {/* Background radial gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <BentoCard highlight glowing className="p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[1px] mx-auto mb-4 shadow-xl shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to manage and enrich your product catalog
            </p>
          </div>

          {/* Role-Based Quick Demo Pills */}
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-purple-300">
              <div className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Quick Role Demo Logins</span>
              </div>
              <span className="text-[10px] text-slate-400">1-click fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold bg-purple-600/80 hover:bg-purple-500 text-white transition-all shadow-sm group"
                title="Admin: All rights across the catalog"
              >
                <span>👑 Admin</span>
              </button>
              <button
                type="button"
                onClick={handleFillUser}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all shadow-sm group"
                title="Standard User: Owns only their products, read-only on others"
              >
                <span>👤 Standard User</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Admin has all catalog rights • Standard User has owner-isolated rights
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="you@company.com"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </BentoCard>

        {/* Security badge below card */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected with opaque token rotation & theft detection</span>
        </div>
      </div>
    </div>
  )
}

