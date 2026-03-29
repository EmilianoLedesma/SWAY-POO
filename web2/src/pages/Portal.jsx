import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import EspeciesGrid from '../components/EspeciesGrid.jsx'
import AvistamientosList from '../components/AvistamientosList.jsx'
import EspecieModal from '../components/EspecieModal.jsx'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx'
import PerfilView from '../components/PerfilView.jsx'
import DashboardView from '../components/DashboardView.jsx'

export default function Portal() {
  const [activeView, setActiveView]       = useState('especies')
  const [profile, setProfile]             = useState(null)
  const [especies, setEspecies]           = useState([])
  const [avistamientos, setAvistamientos] = useState([])
  const [estadosConservacion, setEstados] = useState([])
  const [loading, setLoading]             = useState(true)
  const [modal, setModal]                 = useState({ open: false, especie: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, especie: null })
  const [sidebarOpen, setSidebarOpen]     = useState(() => window.innerWidth > 768)
  const [reporteLoading, setReporteLoading] = useState(false)
  const [reporteMsg, setReporteMsg]         = useState(null)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      const [profileData, especiesData, avistamientosData, estadosData] = await Promise.all([
        api.profile(),
        api.getEspecies(),
        api.getAvistamientos(),
        api.getEstadosConservacion(),
      ])
      // La API retorna { success, colaborador: {...} } — extraemos el objeto plano
      setProfile(profileData.colaborador || profileData)
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

  const handleDeleteEspecie = (id) => {
    const especie = especies.find(e => e.id === id)
    setConfirmDelete({ open: true, especie })
  }

  const handleConfirmDelete = async () => {
    await api.deleteEspecie(confirmDelete.especie.id)
    setConfirmDelete({ open: false, especie: null })
    await refreshEspecies()
  }

  const handleDownloadReporte = async () => {
    setReporteLoading(true)
    setReporteMsg(null)
    try {
      await api.downloadReportePDF()
      setReporteMsg({ type: 'success', text: 'Reporte descargado correctamente.' })
    } catch (e) {
      setReporteMsg({ type: 'error', text: e.message || 'Error al generar el reporte.' })
    } finally {
      setReporteLoading(false)
    }
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
      <aside className={`sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>
          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-name">SWAY</span>
              <span className="brand-sub">Portal Científico</span>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Colapsar' : 'Expandir'}>
            {sidebarOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
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

          <button
            className={`nav-item ${activeView === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveView('perfil')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span className="nav-label">Mi Perfil</span>
          </button>

          <button
            className={`nav-item ${activeView === 'reportes' ? 'active' : ''}`}
            onClick={() => { setActiveView('reportes'); setReporteMsg(null) }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="nav-label">Reportes</span>
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

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <main className="portal-main">
        <Navbar
          title={
            activeView === 'especies'       ? 'Especies Marinas'
            : activeView === 'avistamientos' ? 'Reportes de Avistamientos'
            : activeView === 'perfil'        ? 'Mi Perfil'
            : 'Reportes PDF'
          }
          onCreateEspecie={activeView === 'especies' ? () => setModal({ open: true, especie: null }) : null}
          initials={initials}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <div className="portal-content">
          {activeView === 'especies' ? (
            <EspeciesGrid
              especies={especies}
              onEdit={(esp) => setModal({ open: true, especie: esp })}
              onDelete={handleDeleteEspecie}
            />
          ) : activeView === 'avistamientos' ? (
            <AvistamientosList avistamientos={avistamientos} />
          ) : activeView === 'perfil' ? (
            <PerfilView
              perfil={profile}
              onPerfilUpdated={loadData}
              onLogout={handleLogout}
            />
          ) : (
            <DashboardView
              onDownloadPDF={handleDownloadReporte}
              reporteLoading={reporteLoading}
              reporteMsg={reporteMsg}
            />
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

      {confirmDelete.open && (
        <ConfirmDeleteModal
          especie={confirmDelete.especie}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete({ open: false, especie: null })}
        />
      )}
    </div>
  )
}
