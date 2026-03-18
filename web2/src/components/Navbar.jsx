export default function Navbar({ title, onCreateEspecie, initials, onLogout }) {
  return (
    <header className="top-navbar">
      <h1 className="page-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onCreateEspecie && (
          <button className="btn-new-species" onClick={onCreateEspecie}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Especie
          </button>
        )}

        {initials && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              title="Cerrar sesión"
              onClick={onLogout}
              style={{
                width: 30, height: 30,
                background: '#37517e',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sf)',
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {initials}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
