import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layers, Shield, FileCode2, LogOut, User, Plus, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { BrandLogo } from '../brand/BrandLogo'
import { ThemeToggle } from '../ui/ThemeToggle'

export const Navbar = ({ onOpenCreateProduct }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const apiDocsUrl = (import.meta.env.VITE_API_BASE_URL || 'https://catalog-iq-backend.vercel.app/api/v1')
    .replace(/\/api\/v1\/?$/, '') + '/api/docs/'

  const isActive = (path) => location.pathname === path

  const handleOpenCreateProduct = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: { pathname: '/', search: '', state: { openCreate: true } },
          message: 'Please sign in to add a product to the catalog.',
        },
      })
      setMobileMenuOpen(false)
      return
    }
    if (location.pathname !== '/') {
      navigate('/', { state: { openCreate: true } })
    }
    if (onOpenCreateProduct) {
      onOpenCreateProduct()
    }
    setMobileMenuOpen(false)
  }

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <BrandLogo size="md" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive('/')
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Catalog</span>
            </Link>

            <Link
              to="/sessions"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive('/sessions')
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Sessions</span>
            </Link>

            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Swagger API</span>
            </a>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {onOpenCreateProduct && (
                <Button
                  variant="ai"
                  size="sm"
                  icon={Plus}
                  onClick={handleOpenCreateProduct}
                  className="hidden sm:inline-flex"
                >
                  Add Product
                </Button>
              )}

              {/* User Profile Pill */}
              <div
                className="hidden lg:flex items-center gap-2 pl-2.5 py-1 pr-2 rounded-xl text-xs border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="max-w-[120px] truncate font-medium">
                  {user?.full_name || user?.email}
                </span>
                {user?.role === 'admin' || user?.is_staff || user?.is_superuser ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]">
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                    User
                  </span>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                id="nav-sign-out-btn"
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger-text)] hover:bg-[var(--danger-bg)] border border-transparent hover:border-[var(--danger-border)] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
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

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium ${
                isActive('/')
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Catalog</span>
            </Link>

            <Link
              to="/sessions"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium ${
                isActive('/sessions')
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Sessions</span>
            </Link>

            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Swagger API</span>
            </a>

            {onOpenCreateProduct && (
              <div className="pt-2">
                <Button
                  variant="ai"
                  size="sm"
                  icon={Plus}
                  onClick={handleOpenCreateProduct}
                  className="w-full justify-center"
                >
                  Add Product
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
