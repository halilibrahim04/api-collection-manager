import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: JWT token'ı ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: 401 gelirse login'e yönlendir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ── Collections ──
export const collectionsAPI = {
  list: () => api.get('/collections'),
  import: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/collections/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (id) => api.delete(`/collections/${id}`),
  getEndpoints: (id) => api.get(`/collections/${id}/endpoints`),
}

// ── Endpoints ──
export const endpointsAPI = {
  get: (id) => api.get(`/endpoints/${id}`),
  update: (id, data) => api.put(`/endpoints/${id}`, data),
  run: (id) => api.post(`/endpoints/${id}/run`),
}

// ── Proxy (Ad-hoc reqs) ──
export const proxyAPI = {
  run: (data) => api.post('/proxy/run', data)
}

export default api
