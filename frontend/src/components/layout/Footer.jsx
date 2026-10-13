import React, { useState, useEffect } from 'react'
import { Database, Server, Cpu, GitFork } from 'lucide-react'
import { healthApi } from '../../api/client'

export const Footer = () => {
  const [healthStatus, setHealthStatus] = useState('checking')

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const data = await healthApi.checkReady()
        if (mounted) {
          const isHealthy = data.database === 'connected' || data.status === 'ready'
          setHealthStatus(isHealthy ? 'connected' : 'degraded')
        }
      } catch {
        if (mounted) setHealthStatus('disconnected')
      }
    }
    check()
    const timer = setInterval(check, 45000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  return (
    <footer
      className="mt-auto border-t py-8 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text)' }}>CatalogIQ</span>
            <span>•</span>
            <span>AI-Powered Product Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Django 5.1 REST</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'connected'
                    ? 'bg-[var(--success)] shadow-[0_0_8px_var(--glow)]'
                    : healthStatus === 'checking'
                    ? 'bg-[var(--warning)]'
                    : 'bg-[var(--danger)]'
                }`}
              />
              <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>
                Supabase Postgres 17 (
                {healthStatus === 'connected'
                  ? 'Healthy'
                  : healthStatus === 'checking'
                  ? 'Connecting...'
                  : 'Offline'}
                )
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
              <Cpu className="w-3.5 h-3.5" />
              <span>Groq (qwen/qwen3.8-27b)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Vishwajitp18/CatalogIQ"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
            >
              <GitFork className="w-4 h-4 text-[var(--accent)]" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
