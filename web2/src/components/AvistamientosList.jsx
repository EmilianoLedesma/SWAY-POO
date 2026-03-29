function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return dateStr }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

function formatCoords(lat, lng) {
  if (lat == null || lng == null) return null
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'O'
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}

export default function AvistamientosList({ avistamientos }) {
  if (!avistamientos || avistamientos.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,81,168,0.2)" strokeWidth="1.2" width="64" height="64">
          <path d="M8 32s6-14 24-14 24 14 24 14-6 14-24 14S8 32 8 32z" />
          <circle cx="32" cy="32" r="8" />
          <circle cx="32" cy="32" r="2" />
        </svg>
        <h3>Sin avistamientos registrados</h3>
        <p>Tus reportes de campo aparecerán aquí ordenados cronológicamente.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <p className="section-eyebrow">Datos de campo</p>
        <h2 className="section-headline">Avistamientos</h2>
        <p className="section-sub">Historial de reportes ordenados cronológicamente.</p>
      </div>

      <div className="avistamientos-header">
        <span className="count-pill">
          {avistamientos.length} {avistamientos.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="timeline">
        {avistamientos.map((av, idx) => {
          const coords = formatCoords(av.latitud, av.longitud)

          return (
            <div key={av.id || idx} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-card">

                {/* Encabezado: especie + fecha */}
                <div className="timeline-header">
                  <div>
                    <h3 className="timeline-species">{av.especie_nombre || 'Especie desconocida'}</h3>
                    {av.especie_cientifica && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                        {av.especie_cientifica}
                      </p>
                    )}
                  </div>
                  <span className="timeline-date">{formatDateTime(av.fecha)}</span>
                </div>

                {/* Coordenadas */}
                {coords && (
                  <div className="timeline-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {coords}
                    {av.latitud != null && av.longitud != null && (
                      <a
                        href={`https://www.google.com/maps?q=${av.latitud},${av.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 6, fontSize: '0.7rem', color: '#0051a8' }}
                      >
                        Ver mapa
                      </a>
                    )}
                  </div>
                )}

                {/* Notas */}
                {av.notas && <p className="timeline-notes">{av.notas}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
