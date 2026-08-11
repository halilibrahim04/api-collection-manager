import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiSend, FiUser, FiLock } from 'react-icons/fi'
import './AuthPages.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Tüm alanları doldurun.')
      return
    }
    const result = await login(username, password)
    if (result.success) {
      toast.success('Giriş başarılı!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FiSend size={28} />
          </div>
          <h1>API Collection Manager</h1>
          <p>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">
              <FiUser size={14} />
              Kullanıcı Adı
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kullanici_adi"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FiLock size={14} />
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Hesabınız yok mu? <Link to="/register">Kayıt olun</Link></p>
        </div>
      </div>
    </div>
  )
}
