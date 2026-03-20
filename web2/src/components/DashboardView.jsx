import { useState, useEffect } from 'react'
import { api } from '../api/client.js'

/* ─────────────────────────────────────────
   SVG Donut
───────────────────────────────────────── */
function DonutChart({ segments, size = 190, thickness = 34 }) {
  const R             = (size - thickness) / 2
  const cx            = size / 2
  const cy            = size / 2
  const circumference = 2 * Math.PI * R
  const total         = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      Sin datos
    </div>
  )

  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap  = circumference - dash
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`,
                     transition: 'stroke-dasharray 0.6s ease' }}
          />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text)"
            fontSize="22" fontWeight="700" fontFamily="var(--font-sf)">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-2)"
            fontSize="11" fontFamily="var(--font-sf)">total</text>
    </svg>
  )
}

/* ─────────────────────────────────────────
   SVG Bar Chart (vertical)
───────────────────────────────────────── */
function BarChart({ bars, height = 150 }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1)
  const barW   = 32
  const gap    = 18
  const totalW = bars.length * (barW + gap) - gap + 40

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${height + 46}`} preserveAspectRatio="xMidYMid meet">
      {bars.map((bar, i) => {
        const barH = Math.max((bar.value / maxVal) * height, 4)
        const x    = 20 + i * (barW + gap)
        const y    = height - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="5" fill={bar.color} opacity="0.88" />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                  fill="var(--text)" fontSize="10" fontWeight="600" fontFamily="var(--font-sf)">
              {bar.value}
            </text>
            <text x={x + barW / 2} y={height + 16} textAnchor="middle"
                  fill="var(--text-2)" fontSize="9" fontFamily="var(--font-sf)">
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─────────────────────────────────────────
   SVG Horizontal Bar
───────────────────────────────────────── */
function HBar({ bars }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bars.map((bar, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--text-2)', maxWidth: '70%',
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bar.label}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{bar.value}</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, background: bar.color,
              width: `${(bar.value / maxVal) * 100}%`,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   Stat Card
───────────────────────────────────────── */
function StatCard({ label, value, color, icon, sub }) {
  return (
    <div className="dash-stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="dash-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div className="dash-stat-body">
        <p className="dash-stat-value" style={{ color }}>{value ?? '—'}</p>
        <p className="dash-stat-label">{label}</p>
        {sub && <p className="dash-stat-sub">{sub}</p>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Impact Card
───────────────────────────────────────── */
function ImpactCard({ label, value, unit, color, icon }) {
  return (
    <div className="dash-impact-card">
      <div className="dash-impact-icon" style={{ color, background: color + '15' }}>{icon}</div>
      <p className="dash-impact-val">{typeof value === 'number' ? value.toLocaleString() : '—'}</p>
      <p className="dash-impact-unit">{unit}</p>
      <p className="dash-impact-label">{label}</p>
    </div>
  )
}

/* ─────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────── */
export default function DashboardView({ onDownloadPDF, reporteLoading, reporteMsg }) {
  const [esStats,  setEsStats]  = useState(null)
  const [genStats, setGenStats] = useState(null)
  const [avist,    setAvist]    = useState([])
  const [impacto,  setImpacto]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([
      api.getEstadisticasEspecies(),
      api.getEstadisticas(),
      api.getAvistamientosAll().catch(() => ({ avistamientos: [] })),
      api.getImpactoSostenible().catch(() => ({ impacto: null })),
    ])
      .then(([espRes, genRes, avRes, impRes]) => {
        setEsStats(espRes.estadisticas || espRes)
        setGenStats(genRes)
        setAvist(avRes.avistamientos || [])
        setImpacto(impRes.impacto || null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="dash-loading">Cargando estadísticas…</div>
  if (error)   return <div className="dash-error">Error al cargar datos: {error}</div>

  /* ── Datos derivados ── */
  const totalEsp   = esStats?.total_especies       ?? genStats?.especies_catalogadas ?? 0
  const critCount  = esStats?.en_peligro_critico   ?? 0
  const pelCount   = esStats?.en_peligro           ?? 0
  const vulCount   = esStats?.vulnerables          ?? 0
  const otherCount = Math.max(totalEsp - critCount - pelCount - vulCount, 0)
  const agregMes   = esStats?.especies_agregadas_mes ?? 0
  const habitats   = esStats?.habitats_representados ?? 0
  const calidad    = genStats?.calidad_agua          ?? 0
  const totalAvist = avist.length

  /* Top 5 species más avistadas */
  const especieCount = {}
  avist.forEach(a => {
    const k = a.especie_nombre || 'Sin nombre'
    especieCount[k] = (especieCount[k] || 0) + 1
  })
  const topEspecies = Object.entries(especieCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({
      label,
      value,
      color: ['#0071e3','#34c759','#ff9500','#ff3b30','#5ac8fa','#af52de'][i],
    }))

  /* Avistamientos recientes */
  const recientes = [...avist]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 6)

  const donutSegments = [
    { label: 'Extinción crítica', value: critCount,  color: '#ff3b30' },
    { label: 'En Peligro',        value: pelCount,   color: '#ff9500' },
    { label: 'Vulnerables',       value: vulCount,   color: '#f59e0b' },
    { label: 'Otras',             value: otherCount, color: '#34c759' },
  ]

  const barConservacion = [
    { label: 'Total',       value: totalEsp,            color: '#0071e3' },
    { label: 'Críticas',    value: critCount,            color: '#ff3b30' },
    { label: 'En Peligro',  value: pelCount,             color: '#ff9500' },
    { label: 'Vulnerables', value: vulCount,             color: '#f59e0b' },
    { label: 'Otras',       value: otherCount,           color: '#34c759' },
  ]

  return (
    <div className="dashboard-view">

      {/* ── Encabezado ── */}
      <div className="dash-header">
        <h2 className="dash-title">Dashboard de Conservación</h2>
        <p className="dash-subtitle">Estadísticas en tiempo real del catálogo marino SWAY</p>
      </div>

      {/* ── Fila 1: Stats principales ── */}
      <div className="dash-stats-grid">
        <StatCard label="Especies catalogadas" value={totalEsp} color="var(--blue)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M2 12s4-3 10-3 10 3 10 3-4 3-10 3-10-3-10-3z"/><circle cx="12" cy="12" r="2"/></svg>}
        />
        <StatCard label="Extinción crítica" value={critCount} color="var(--red)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <StatCard label="En peligro" value={pelCount} color="var(--orange)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Vulnerables" value={vulCount} color="var(--amber)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
      </div>

      {/* ── Fila 2: Stats secundarias ── */}
      <div className="dash-stats-grid">
        <StatCard label="Agregadas este mes" value={agregMes} color="var(--teal)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
        />
        <StatCard label="Avistamientos registrados" value={totalAvist} color="#8b5cf6"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
        />
        <StatCard label="Hábitats representados" value={habitats} color="var(--green)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        />
        <StatCard label="Calidad del agua" value={`${calidad}%`} color="var(--ocean)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20"><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"/><path d="M12 6v6l4 2"/></svg>}
        />
      </div>

      {/* ── Fila 3: Gráficas de conservación ── */}
      <div className="dash-charts-row">

        {/* Donut: Estado de conservación */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">Estado de Conservación</h3>
          <div className="dash-donut-wrapper">
            <DonutChart segments={donutSegments} size={190} thickness={34} />
            <ul className="dash-legend">
              {donutSegments.map((s, i) => (
                <li key={i} className="dash-legend-item">
                  <span className="dash-legend-dot" style={{ background: s.color }} />
                  <span className="dash-legend-label">{s.label}</span>
                  <span className="dash-legend-val">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barras verticales: distribución */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">Distribución por Estado</h3>
          <div className="dash-bar-wrapper">
            <BarChart bars={barConservacion} height={155} />
          </div>
          <div className="dash-bar-meta">
            <span>Hábitats: <strong>{habitats}</strong></span>
            <span>Regiones: <strong>{esStats?.regiones_cubiertas ?? 7}</strong></span>
            <span>Biodiversidad: <strong>{genStats?.biodiversidad ?? '—'}%</strong></span>
          </div>
        </div>

      </div>

      {/* ── Fila 4: Avistamientos ── */}
      <div className="dash-charts-row">

        {/* Barras horizontales: top especies */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">
            Especies más avistadas
            <span className="dash-chart-badge">{totalAvist} total</span>
          </h3>
          {topEspecies.length > 0
            ? <HBar bars={topEspecies} />
            : <p className="dash-empty-msg">Sin avistamientos registrados</p>
          }
        </div>

        {/* Avistamientos recientes */}
        <div className="dash-chart-card">
          <h3 className="dash-chart-title">Avistamientos recientes</h3>
          {recientes.length > 0 ? (
            <ul className="dash-activity-list">
              {recientes.map(a => (
                <li key={a.id} className="dash-activity-item">
                  <div className="dash-activity-dot" style={{ background: '#8b5cf6' }} />
                  <div className="dash-activity-body">
                    <p className="dash-activity-title">{a.especie_nombre}</p>
                    <p className="dash-activity-meta">
                      {a.fecha ? new Date(a.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      {a.latitud != null && ` · ${a.latitud.toFixed(2)}, ${a.longitud?.toFixed(2)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty-msg">Sin avistamientos registrados</p>
          )}
        </div>

      </div>

      {/* ── Fila 5: Impacto sostenible ── */}
      {impacto && (
        <div className="dash-section">
          <h3 className="dash-section-title">Impacto Sostenible</h3>
          <div className="dash-impact-grid">
            <ImpactCard label="Agua limpiada" value={impacto.agua_limpiada} unit="litros" color="#0071e3"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22"><path d="M12 2a10 10 0 0 0 0 20A10 10 0 0 0 12 2z"/><path d="M6.3 8c1 2 2.7 3 5.7 3s4.7-1 5.7-3"/></svg>}
            />
            <ImpactCard label="Corales plantados" value={impacto.corales_plantados} unit="unidades" color="#f59e0b"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22"><path d="M12 22V12M12 12C12 7 8 4 8 4s0 4 4 8zM12 12c0-5 4-8 4-8s0 4-4 8z"/></svg>}
            />
            <ImpactCard label="Familias beneficiadas" value={impacto.familias_beneficiadas} unit="familias" color="#34c759"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            />
            <ImpactCard label="Plástico reciclado" value={impacto.plastico_reciclado} unit="kg" color="#ff6b35"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
            />
          </div>
        </div>
      )}

      {/* ── PDF Download ── */}
      <div className="dash-pdf-card">
        <div className="dash-pdf-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               width="36" height="36" style={{ color: 'var(--ocean-dark)', flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <div>
            <p className="dash-pdf-title">Reporte Completo PDF</p>
            <p className="dash-pdf-desc">Catálogo de especies + estadísticas de conservación</p>
          </div>
        </div>
        <div className="dash-pdf-right">
          {reporteMsg && (
            <span className={`reportes-msg ${reporteMsg.type}`}>{reporteMsg.text}</span>
          )}
          <button
            className={`reportes-btn compact ${reporteLoading ? 'loading' : ''}`}
            onClick={onDownloadPDF}
            disabled={reporteLoading}
          >
            {reporteLoading ? (
              <><span className="btn-spinner" /> Generando…</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
