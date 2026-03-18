export default function Navbar({ title, onCreateEspecie }) {
  return (
    <header className="top-navbar">
      <h1 className="page-title">{title}</h1>
      <div>
        {onCreateEspecie && (
          <button className="btn-new-species" onClick={onCreateEspecie}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Especie
          </button>
        )}
      </div>
    </header>
  )
}
