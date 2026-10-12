import React, { useState, useEffect } from 'react'
import {
  Shield,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  RotateCw,
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
import { Badge } from '../../components/ui/Badge'

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
      showError(err, 'Failed to Change Password')
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.current_password?.[0] ||
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to change password. Please verify your current password.'
      setPasswordError(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Security & Active Sessions
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5">
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
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
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
          <h2 className="text-lg font-semibold text-white">
            Active Devices ({sessions.length})
          </h2>
          <span className="text-xs text-slate-400">
            Signed in as <strong className="text-slate-200">{user?.email}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <BentoCard className="p-8 text-center text-slate-400">
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
                      ? 'border-purple-500/40 bg-purple-950/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        session.is_current
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {browser} on {os}
                        </span>
                        {session.is_current ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Current session
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-white/10">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          IP: <strong className="text-slate-300 font-medium">{session.ip_address || '127.0.0.1'}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Signed in:{' '}
                          <span className="text-slate-300">
                            {session.created_at
                              ? new Date(session.created_at).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          Last active:{' '}
                          <span className={session.is_current ? 'text-emerald-400 font-medium' : 'text-slate-300'}>
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
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRevokeSingle(session.id)}
                        isLoading={actionLoading === session.id}
                        className="text-rose-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10"
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 italic px-2">
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
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Change Account Password
            </h3>
            <p className="text-xs text-slate-400">
              Updating your password revokes all other active sessions across devices.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="my-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="my-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm"
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

