import React from 'react'
import { Sparkles, Database, Server, Cpu, Github } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/[0.07] bg-slate-950/60 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">CatalogIQ</span>
            <span>•</span>
            <span>AI-Powered Product Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Django 5.1 REST</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Supabase PostgreSQL 17</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Groq (qwen/qwen3.8-27b)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Vishwajitp18/CatalogIQ"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
