import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token and request UUID
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Attach a client request-id if not present
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = crypto.randomUUID()
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with silent token refresh queue
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:unauthorized'))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken = data.access
        const newRefreshToken = data.refresh

        localStorage.setItem('access_token', newAccessToken)
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken)
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:unauthorized'))
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login/', credentials)
    return res.data
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register/', userData)
    return res.data
  },
  refresh: async (refresh) => {
    const res = await apiClient.post('/auth/refresh/', { refresh })
    return res.data
  },
  logout: async (refresh) => {
    const res = await apiClient.post('/auth/logout/', { refresh })
    return res.data
  },
  logoutAll: async () => {
    const res = await apiClient.post('/auth/logout-all/')
    return res.data
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me/')
    return res.data
  },
  getSessions: async () => {
    const res = await apiClient.get('/auth/sessions/')
    return res.data
  },
  revokeSession: async (sessionId) => {
    const res = await apiClient.delete(`/auth/sessions/${sessionId}/`)
    return res.data
  },
  changePassword: async (passwords) => {
    const res = await apiClient.post('/auth/password/change/', passwords)
    return res.data
  },
}

export const catalogApi = {
  getProducts: async (params = {}) => {
    const res = await apiClient.get('/products/', { params })
    return res.data
  },
  getStats: async (params = {}) => {
    const res = await apiClient.get('/catalog/stats/', { params })
    return res.data
  },
  getProduct: async (id) => {
    const res = await apiClient.get(`/products/${id}/`)
    return res.data
  },
  createProduct: async (productData) => {
    const res = await apiClient.post('/products/', productData)
    return res.data
  },
  updateProduct: async (id, productData) => {
    const res = await apiClient.patch(`/products/${id}/`, productData)
    return res.data
  },
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}/`)
    return res.data
  },
  getBrands: async () => {
    const res = await apiClient.get('/brands/')
    return res.data
  },
  createBrand: async (brandData) => {
    const res = await apiClient.post('/brands/', brandData)
    return res.data
  },
  getCategories: async () => {
    const res = await apiClient.get('/categories/')
    return res.data
  },
  createCategory: async (categoryData) => {
    const res = await apiClient.post('/categories/', categoryData)
    return res.data
  },
}

export const aiApi = {
  generateDescription: async (payload) => {
    const res = await apiClient.post('/ai/product-description/', payload)
    return res.data
  },
  searchNatural: async (queryOrPayload) => {
    const body =
      typeof queryOrPayload === 'string'
        ? { query: queryOrPayload, limit: 20 }
        : queryOrPayload
    const res = await apiClient.post('/ai/search/', body)
    return res.data
  },
  search: async (payload) => {
    const body =
      typeof payload === 'string'
        ? { query: payload, limit: 20 }
        : payload
    const res = await apiClient.post('/ai/search/', body)
    return res.data
  },
}

export const healthApi = {
  checkReady: async () => {
    const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    const res = await axios.get(`${rootUrl}/api/health/ready/`)
    return res.data
  },
  checkLiveness: async () => {
    const rootUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    const res = await axios.get(`${rootUrl}/api/health/`)
    return res.data
  },
}
