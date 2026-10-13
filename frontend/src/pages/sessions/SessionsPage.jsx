import React, { useState, useEffect } from 'react'
import {
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Lock,
} from 'lucide-react'
import { authApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { Button } from '../../components/ui/Button'
import { parseApiError } from '../../utils/errorParser'

export const SessionsPage = () => {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const data = await authApi.getSessions()
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleRevokeSingle = async (sessionId) => {
    if (!window.confirm('Are you sure you want to revoke this session?')) return
    setActionLoading(sessionId)
    try {
      await authApi.revokeSession(sessionId)
      showSuccess('Session revoked successfully.')
      setMessage({ type: 'success', text: 'Session revoked successfully.' })
      await fetchSessions()
    } catch (err) {
      showError(err, 'Failed to Revoke Session')
      setMessage({ type: 'error', text: 'Failed to revoke session.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeAll = async () => {
    if (
      !window.confirm(
        'Revoke all sessions? You will need to log in again on other devices.'
      )
    )
      return
    setActionLoading('all')
    try {
      const res = await authApi.logoutAll()
      const successText = `Revoked ${res.revoked_count || 'all'} sessions across your devices.`
      showSuccess(successText)
      setMessage({
        type: 'success',
        text: successText,
      })
      await fetchSessions()
    } catch (err) {
      showError(err, 'Failed to Revoke All Sessions')
      setMessage({ type: 'error', text: 'Failed to revoke all sessions.' })
    } finally {
      setActionLoading(null)
    }
  }

  const parseDevice = (ua = '') => {
    const isMobile = /mobile|android|iphone|ipad/i.test(ua)
    let browser = 'Unknown Browser'
    if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome'
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
    else if (/edg/i.test(ua)) browser = 'Edge'

    let os = 'Unknown OS'
    if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
    else if (/windows/i.test(ua)) os = 'Windows'
    else if (/linux/i.test(ua)) os = 'Linux'
    else if (/iphone|ipad/i.test(ua)) os = 'iOS'
    else if (/android/i.test(ua)) os = 'Android'

    return { isMobile, browser, os }
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      })
      const successMsg = 'Password changed successfully. All other active sessions have been revoked.'
      setPasswordSuccess(successMsg)
      showSuccess(successMsg)
      setCurrentPassword('')
      setNewPassword('')
      await fetchSessions()
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to change password. Please verify your current password.')
      showError(err, 'Failed to Change Password')
      setPasswordError(parsed.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-strong)] text-[var(--accent)]">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Security & Active Sessions
            </h1>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Monitor and manage your active logins across web browsers and devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchSessions}
            disabled={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleRevokeAll}
            isLoading={actionLoading === 'all'}
            disabled={isLoading || !sessions.some((s) => !s.is_current)}
          >
            Revoke All Other Sessions
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between transition-all ${
            message.type === 'success'
              ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]'
              : 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Active Devices ({sessions.length})
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Signed in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--accent)]" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <BentoCard className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No active sessions found.
          </BentoCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => {
              const { isMobile, browser, os } = parseDevice(session.user_agent)
              const Icon = isMobile ? Smartphone : Laptop

              return (
                <BentoCard
                  key={session.id}
                  className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    session.is_current
                      ? 'border-[var(--border-strong)] bg-[var(--surface)] shadow-md'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        session.is_current
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]'
                          : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {browser} on {os}
                        </span>
                        {session.is_current ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                            Current session
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                            style={{
                              backgroundColor: 'var(--surface-muted)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
                          IP: <strong className="font-medium" style={{ color: 'var(--text)' }}>{session.ip_address || '127.0.0.1'}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
                          Signed in:{' '}
                          <span style={{ color: 'var(--text)' }}>
                            {session.created_at
                              ? new Date(session.created_at).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" style={{ color: 'var(--text-subtle)' }} />
                          Last active:{' '}
                          <span className={session.is_current ? 'text-[var(--success-text)] font-semibold' : ''} style={{ color: session.is_current ? undefined : 'var(--text)' }}>
                            {session.is_current
                              ? 'Active now'
                              : session.last_used_at
                              ? new Date(session.last_used_at).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0 w-full sm:w-auto flex justify-end">
                    {!session.is_current ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRevokeSingle(session.id)}
                        isLoading={actionLoading === session.id}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-xs italic px-2" style={{ color: 'var(--text-subtle)' }}>
                        This device
                      </span>
                    )}
                  </div>
                </BentoCard>
              )
            })}
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <BentoCard highlight className="p-6 max-w-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              Change Account Password
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updating your password revokes all other active sessions across devices.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="my-4 p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-[var(--danger-text)] shrink-0 mt-0.5" />
            <div className="flex-1 whitespace-pre-line leading-relaxed font-normal">{passwordError}</div>
          </div>
        )}

        {passwordSuccess && (
          <div className="my-4 p-3 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] text-xs">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl theme-input px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl theme-input px-3.5 py-2.5 text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={passwordLoading}
            icon={Lock}
          >
            Update Password
          </Button>
        </form>
      </BentoCard>
    </div>
  )
}
