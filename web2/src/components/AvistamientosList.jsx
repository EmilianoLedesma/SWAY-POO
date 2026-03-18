function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return dateStr }
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
          const species  = av.nombre_comun || av.especie || av.nombre_especie || 'Especie desconocida'
          const date     = av.fecha_avistamiento || av.fecha || av.created_at
          const location = av.ubicacion || av.lugar || av.localizacion
          const notes    = av.notas || av.notas_adicionales || av.observaciones

          return (
            <div key={av.id_avistamiento || idx} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-card">
                <div className="timeline-header">
                  <h3 className="timeline-species">{species}</h3>
                  <span className="timeline-date">{formatDate(date)}</span>
                </div>

                {location && (
                  <div className="timeline-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {location}
                  </div>
                )}

                {(av.temperatura || av.profundidad || av.visibilidad) && (
                  <div className="timeline-data">
                    {av.temperatura && <span className="data-chip">T° {av.temperatura}°C</span>}
                    {av.profundidad  && <span className="data-chip">↓ {av.profundidad} m</span>}
                    {av.visibilidad  && <span className="data-chip">VIS {av.visibilidad} m</span>}
                  </div>
                )}

                {notes && <p className="timeline-notes">{notes}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
