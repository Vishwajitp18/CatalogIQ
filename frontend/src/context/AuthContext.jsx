import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const profile = await authApi.getMe()
          setUser(profile)
          localStorage.setItem('user', JSON.stringify(profile))
        } catch {
          // Handled by client refresh or unauthorized event
        }
      }
      setIsLoading(false)
    }

    initAuth()

    const handleUnauthorized = () => {
      setUser(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (email, password, fullName) => {
    const data = await authApi.register({
      email,
      password,
      full_name: fullName,
    })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) {
        await authApi.logout(refresh)
      }
    } catch (err) {
      console.warn('Logout API call failed:', err)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const logoutAll = async () => {
    try {
      await authApi.logoutAll()
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const profile = await authApi.getMe()
      setUser(profile)
      localStorage.setItem('user', JSON.stringify(profile))
      return profile
    } catch {
      return null
    }
  }

  const isAdmin = Boolean(user?.role === 'admin' || user?.is_staff || user?.is_superuser)
  const userRole = user ? (user.role || (user.is_staff ? 'admin' : 'user')) : null

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin,
    userRole,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

