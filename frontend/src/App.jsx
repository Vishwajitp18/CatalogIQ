import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { SessionsPage } from './pages/sessions/SessionsPage'
import { NotFoundPage } from './pages/error/NotFoundPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { CatalogPage } from './pages/catalog/CatalogPage'

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col theme-canvas antialiased selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]">
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
                      <CatalogPage
                        isCreateOpen={isCreateModalOpen}
                        onCloseCreate={() => setIsCreateModalOpen(false)}
                      />
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
