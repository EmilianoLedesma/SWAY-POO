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

      {/* ── Left art panel ── */}
      <div className="login-panel-art">
        {/* Ocean wave SVG decoration */}
        <svg className="login-art-wave" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path
            fill="rgba(255,255,255,0.06)"
            d="M0,80 C240,140 480,20 720,80 C960,140 1200,20 1440,80 L1440,200 L0,200 Z"
          />
          <path
            fill="rgba(255,255,255,0.04)"
            d="M0,120 C300,60 600,180 900,120 C1200,60 1320,140 1440,120 L1440,200 L0,200 Z"
          />
        </svg>

        <div className="login-art-content">
          <div className="login-art-logo">SWAY</div>
          <p className="login-art-tagline">
            Plataforma científica para la conservación de los océanos del mundo.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-panel-form">
        <div className="login-form-inner">

          <div className="login-form-header">
            <h1 className="login-form-title">Iniciar sesión</h1>
            <p className="login-form-sub">Accede a tu portal de colaborador científico</p>
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

          <p className="login-footer-note">
            Acceso exclusivo para colaboradores científicos de SWAY
          </p>
        </div>
      </div>

    </div>
  )
}
