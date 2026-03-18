const STATUS_CODES = [
  { keys: ['extinto', 'extincion', 'extinción'],                              code: 'EX', color: '#ff3b30', bg: '#fff0ef' },
  { keys: ['crítico', 'critico', 'critical'],                                 code: 'CR', color: '#ff6b35', bg: '#fff3ef' },
  { keys: ['peligro', 'endangered', 'danger'],                                code: 'EN', color: '#ff9500', bg: '#fff6e5' },
  { keys: ['vulnerable'],                                                      code: 'VU', color: '#f59e0b', bg: '#fffbeb' },
  { keys: ['casi', 'near', 'amenazado'],                                       code: 'NT', color: '#5ac8fa', bg: '#eaf8ff' },
  { keys: ['preocupacion', 'preocupación', 'menor', 'least', 'concern'],      code: 'LC', color: '#34c759', bg: '#edfaf2' },
]

const DEFAULT_BADGE = { code: '??', color: '#aeaeb2', bg: '#f5f5f7' }

function getStatusBadge(name) {
  if (!name) return DEFAULT_BADGE
  const lower = name.toLowerCase()
  for (const entry of STATUS_CODES) {
    if (entry.keys.some(k => lower.includes(k))) return entry
  }
  return DEFAULT_BADGE
}

function PlaceholderPhoto() {
  return (
    <div className="card-photo-placeholder">
      <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,81,168,0.22)" strokeWidth="1.2" width="52" height="52">
        <path d="M8 32s6-14 24-14 24 14 24 14-6 14-24 14S8 32 8 32z" />
        <circle cx="32" cy="32" r="8" />
        <circle cx="32" cy="32" r="2" />
        <path d="M14 24s4-6 10-8M50 40s-4 6-10 8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function EspecieCard({ especie, onEdit, onDelete, featured }) {
  const badge = getStatusBadge(especie.estado_conservacion || especie.nombre_estado)

  return (
    <div className={`especie-card${featured ? ' featured' : ''}`}>
      <div className="card-photo-wrap">
        {especie.imagen_url ? (
          <div className="card-photo" style={{ backgroundImage: `url(${especie.imagen_url})` }} />
        ) : (
          <PlaceholderPhoto />
        )}
        <div
          className="card-badge"
          style={{ background: badge.bg, color: badge.color }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: badge.color, display: 'inline-block', flexShrink: 0,
          }} />
          {badge.code}
        </div>
      </div>

      <div className="card-content">
        <h3 className="species-common">{especie.nombre_comun}</h3>
        <p className="species-scientific">{especie.nombre_cientifico}</p>

        <div className="card-actions">
          <button
            className="btn-card btn-card-edit"
            onClick={e => { e.stopPropagation(); onEdit(especie) }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>
          <button
            className="btn-card btn-card-delete"
            onClick={e => { e.stopPropagation(); onDelete(especie.id) }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EspeciesGrid({ especies, onEdit, onDelete }) {
  if (especies.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 64 64" fill="none" stroke="rgba(0,81,168,0.2)" strokeWidth="1.2" width="64" height="64">
          <path d="M8 32s6-14 24-14 24 14 24 14-6 14-24 14S8 32 8 32z" />
          <circle cx="32" cy="32" r="8" />
          <circle cx="32" cy="32" r="2" />
        </svg>
        <h3>Sin especies registradas</h3>
        <p>Agrega la primera especie marina al catálogo científico.</p>
      </div>
    )
  }

  const total       = especies.length
  const enPeligro   = especies.filter(e =>
    ['CR', 'EN', 'EX'].includes(getStatusBadge(e.estado_conservacion || e.nombre_estado).code)
  ).length
  const vulnerables = especies.filter(e =>
    getStatusBadge(e.estado_conservacion || e.nombre_estado).code === 'VU'
  ).length
  const estables    = total - enPeligro - vulnerables

  return (
    <>
      <div className="stats-strips">
        <div className="stat-strip">
          <span className="stat-num">{total}</span>
          <span className="stat-lbl">Especies en catálogo</span>
        </div>
        <div className="stat-strip strip-danger">
          <span className="stat-num">{enPeligro}</span>
          <span className="stat-lbl">En peligro (CR / EN / EX)</span>
        </div>
        <div className="stat-strip strip-warning">
          <span className="stat-num">{vulnerables}</span>
          <span className="stat-lbl">Vulnerables (VU)</span>
        </div>
        <div className="stat-strip strip-success">
          <span className="stat-num">{estables}</span>
          <span className="stat-lbl">Estables (NT / LC)</span>
        </div>
      </div>

      <div className="especies-grid">
        {especies.map((especie, idx) => (
          <EspecieCard
            key={especie.id}
            especie={especie}
            onEdit={onEdit}
            onDelete={onDelete}
            featured={idx === 0}
          />
        ))}
      </div>
    </>
  )
}
