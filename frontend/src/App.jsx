import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { SessionsPage } from './pages/sessions/SessionsPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#06080F] text-slate-100 antialiased selection:bg-purple-500/30 selection:text-white">
          <Navbar onOpenCreateProduct={() => setIsCreateModalOpen(true)} />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/sessions"
                element={
                  <ProtectedRoute>
                    <SessionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
                    <p>Catalog Explorer loading...</p>
                  </div>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
