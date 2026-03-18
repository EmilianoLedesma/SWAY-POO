import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(email, password)
      navigate('/portal')
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="login-logo-mark">S</div>
          <h1 className="login-title">SWAY</h1>
          <p className="login-subtitle">Portal Científico</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="investigador@sway.org"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Accediendo…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-footer-note">Acceso exclusivo para colaboradores científicos de SWAY</p>
      </div>
    </div>
  )
}
