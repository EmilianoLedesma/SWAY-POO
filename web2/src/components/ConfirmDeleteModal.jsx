import { useEffect } from 'react'

export default function ConfirmDeleteModal({ especie, onConfirm, onCancel }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onCancel])

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-drawer confirm-modal"
        onClick={e => e.stopPropagation()}
        style={{ width: 380 }}
      >
        {/* Icono */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,59,48,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="1.75"
                 width="24" height="24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <div style={{ padding: '16px 28px 0', textAlign: 'center' }}>
          <h3 style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'var(--font-sf)',
          }}>
            Eliminar especie
          </h3>
          <p style={{
            margin: 0,
            fontSize: 13.5,
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}>
            ¿Estás seguro de que quieres eliminar{' '}
            <strong style={{ color: 'var(--text)' }}>
              {especie?.nombre_comun || 'esta especie'}
            </strong>
            ?<br />Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '24px 28px 28px',
        }}>
          <button
            className="btn-cancel-modal"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 40,
              border: 'none',
              borderRadius: 10,
              background: '#ff3b30',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sf)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
