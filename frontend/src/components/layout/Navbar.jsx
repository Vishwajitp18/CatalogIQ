import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Layers, Shield, FileCode2, LogOut, User, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export const Navbar = ({ onOpenCreateProduct }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/75 border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight apple-header-text">
                Catalog<span className="ai-gradient-text">IQ</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              Catalog
            </Link>

            {isAuthenticated && (
              <Link
                to="/sessions"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isActive('/sessions')
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" />
                Security & Sessions
              </Link>
            )}

            <a
              href="http://localhost:8000/api/docs/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FileCode2 className="w-4 h-4 text-slate-400" />
              Swagger API
            </a>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {onOpenCreateProduct && (
                <Button
                  variant="ai"
                  size="sm"
                  icon={Plus}
                  onClick={onOpenCreateProduct}
                  className="hidden sm:inline-flex"
                >
                  Add Product
                </Button>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span className="max-w-[120px] truncate font-medium">
                    {user?.full_name || user?.email}
                  </span>
                  {user?.role === 'admin' || user?.is_staff || user?.is_superuser ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300 shadow-sm">
                      👑 Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 border border-white/10 text-slate-300">
                      Standard User
                    </span>
                  )}
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

