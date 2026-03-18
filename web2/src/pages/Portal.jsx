import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import EspeciesGrid from '../components/EspeciesGrid.jsx'
import AvistamientosList from '../components/AvistamientosList.jsx'
import EspecieModal from '../components/EspecieModal.jsx'

export default function Portal() {
  const [activeView, setActiveView]       = useState('especies')
  const [profile, setProfile]             = useState(null)
  const [especies, setEspecies]           = useState([])
  const [avistamientos, setAvistamientos] = useState([])
  const [estadosConservacion, setEstados] = useState([])
  const [loading, setLoading]             = useState(true)
  const [modal, setModal]                 = useState({ open: false, especie: null })
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [profileData, especiesData, avistamientosData, estadosData] = await Promise.all([
        api.profile(),
        api.getEspecies(),
        api.getAvistamientos(),
        api.getEstadosConservacion(),
      ])
      setProfile(profileData)
      setEspecies(especiesData.especies || especiesData || [])
      setAvistamientos(avistamientosData.avistamientos || avistamientosData || [])
      setEstados(estadosData?.estados || estadosData || [])
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { loadData() }, [loadData])

  const refreshEspecies = async () => {
    const data = await api.getEspecies()
    setEspecies(data.especies || data || [])
  }

  const handleLogout = async () => {
    try { await api.logout() } catch { /* ignore */ }
    navigate('/')
  }

  const handleDeleteEspecie = async (id) => {
    if (!window.confirm('¿Eliminar esta especie? Esta acción no se puede deshacer.')) return
    await api.deleteEspecie(id)
    await refreshEspecies()
  }

  const handleSaveEspecie = async (formData) => {
    if (modal.especie) {
      await api.updateEspecie(modal.especie.id, formData)
    } else {
      await api.createEspecie(formData)
    }
    setModal({ open: false, especie: null })
    await refreshEspecies()
  }

  const initials = profile
    ? (profile.nombre || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
    : '?'

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-mark">SWAY</div>
        <p className="loading-text">Cargando portal científico…</p>
      </div>
    )
  }

  return (
    <div className="portal-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>
          <div className="brand-text">
            <span className="brand-name">SWAY</span>
            <span className="brand-sub">Portal Científico</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'especies' ? 'active' : ''}`}
            onClick={() => setActiveView('especies')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
              <path d="M2 12s4-3 10-3 10 3 10 3-4 3-10 3-10-3-10-3z" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="nav-label">Especies Marinas</span>
          </button>

          <button
            className={`nav-item ${activeView === 'avistamientos' ? 'active' : ''}`}
            onClick={() => setActiveView('avistamientos')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="nav-label">Avistamientos</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-pill">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <p className="profile-name">{profile?.nombre || 'Colaborador'}</p>
              <p className="profile-role">{profile?.especialidad || 'Científico'}</p>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="15" height="15">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="logout-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="portal-main">
        <Navbar
          title={activeView === 'especies' ? 'Especies Marinas' : 'Reportes de Avistamientos'}
          onCreateEspecie={activeView === 'especies' ? () => setModal({ open: true, especie: null }) : null}
          initials={initials}
          onLogout={handleLogout}
        />

        <div className="portal-content">
          {activeView === 'especies' ? (
            <EspeciesGrid
              especies={especies}
              onEdit={(esp) => setModal({ open: true, especie: esp })}
              onDelete={handleDeleteEspecie}
            />
          ) : (
            <AvistamientosList avistamientos={avistamientos} />
          )}
        </div>
      </main>

      {modal.open && (
        <EspecieModal
          especie={modal.especie}
          estadosConservacion={estadosConservacion}
          onSave={handleSaveEspecie}
          onClose={() => setModal({ open: false, especie: null })}
        />
      )}
    </div>
  )
}
