import { useState, useEffect } from 'react'

const EMPTY = {
  nombre_comun: '',
  nombre_cientifico: '',
  descripcion: '',
  esperanza_vida: '',
  poblacion_estimada: '',
  id_estado_conservacion: '',
  imagen_url: '',
}

export default function EspecieModal({ especie, estadosConservacion, onSave, onClose }) {
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(especie ? {
      nombre_comun:            especie.nombre_comun           || '',
      nombre_cientifico:       especie.nombre_cientifico      || '',
      descripcion:             especie.descripcion            || '',
      esperanza_vida:          especie.esperanza_vida != null ? (parseInt(especie.esperanza_vida) || '') : '',
      poblacion_estimada:      especie.poblacion_estimada     ?? '',
      id_estado_conservacion:  especie.id_estado_conservacion ?? '',
      imagen_url:              especie.imagen_url             || '',
    } : EMPTY)
    setErrors({})
  }, [especie])

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const validate = () => {
    const errs = {}
    if (!form.nombre_comun.trim())      errs.nombre_comun      = 'Requerido'
    if (!form.nombre_cientifico.trim()) errs.nombre_cientifico = 'Requerido'
    if (!form.id_estado_conservacion)   errs.id_estado_conservacion = 'Selecciona un estado'
    if (form.esperanza_vida !== '' && Number(form.esperanza_vida) < 1) errs.esperanza_vida = 'Debe ser > 0'
    if (form.poblacion_estimada !== '' && Number(form.poblacion_estimada) < 0) errs.poblacion_estimada = 'Debe ser ≥ 0'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        esperanza_vida:         form.esperanza_vida        !== '' ? Number(form.esperanza_vida)        : null,
        poblacion_estimada:     form.poblacion_estimada    !== '' ? Number(form.poblacion_estimada)    : null,
        id_estado_conservacion: Number(form.id_estado_conservacion),
      })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSaving(false)
    }
  }

  const safeEstados = Array.isArray(estadosConservacion) ? estadosConservacion : []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-drawer" onClick={e => e.stopPropagation()}>

        {especie?.imagen_url && (
          <div
            className="modal-photo-strip"
            style={{ backgroundImage: `url(${especie.imagen_url})` }}
          />
        )}

        <div className="modal-header">
          <h2>{especie ? 'Editar especie' : 'Nueva especie marina'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {errors.submit && (
            <div className="modal-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {errors.submit}
            </div>
          )}

          <div className="modal-row">
            <div className={`modal-field ${errors.nombre_comun ? 'has-error' : ''}`}>
              <label>Nombre Común *</label>
              <input
                name="nombre_comun"
                value={form.nombre_comun}
                onChange={handleChange}
                placeholder="Tortuga Verde"
                maxLength={100}
              />
              {errors.nombre_comun && <span className="field-err">{errors.nombre_comun}</span>}
            </div>

            <div className={`modal-field ${errors.nombre_cientifico ? 'has-error' : ''}`}>
              <label>Nombre Científico *</label>
              <input
                name="nombre_cientifico"
                value={form.nombre_cientifico}
                onChange={handleChange}
                placeholder="Chelonia mydas"
                className="italic-input"
                maxLength={100}
              />
              {errors.nombre_cientifico && <span className="field-err">{errors.nombre_cientifico}</span>}
            </div>
          </div>

          <div className={`modal-field ${errors.id_estado_conservacion ? 'has-error' : ''}`}>
            <label>Estado de Conservación *</label>
            <select
              name="id_estado_conservacion"
              value={form.id_estado_conservacion}
              onChange={handleChange}
            >
              <option value="">Seleccionar estado…</option>
              {safeEstados.map(e => {
                const id   = e.id_estado_conservacion ?? e.id
                const name = e.nombre_estado ?? e.nombre
                return <option key={id} value={id}>{name}</option>
              })}
            </select>
            {errors.id_estado_conservacion && <span className="field-err">{errors.id_estado_conservacion}</span>}
          </div>

          <div className="modal-field">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={4}
              placeholder="Descripción de la especie, hábitats, comportamiento…"
            />
          </div>

          <div className="modal-row">
            <div className={`modal-field ${errors.esperanza_vida ? 'has-error' : ''}`}>
              <label>Esperanza de Vida (años)</label>
              <input
                type="number"
                name="esperanza_vida"
                value={form.esperanza_vida}
                onChange={handleChange}
                placeholder="80"
                min="1" max="500"
              />
              {errors.esperanza_vida && <span className="field-err">{errors.esperanza_vida}</span>}
            </div>

            <div className={`modal-field ${errors.poblacion_estimada ? 'has-error' : ''}`}>
              <label>Población Estimada</label>
              <input
                type="number"
                name="poblacion_estimada"
                value={form.poblacion_estimada}
                onChange={handleChange}
                placeholder="10000"
                min="0"
              />
              {errors.poblacion_estimada && <span className="field-err">{errors.poblacion_estimada}</span>}
            </div>
          </div>

          <div className="modal-field">
            <label>URL de Fotografía</label>
            <input
              name="imagen_url"
              value={form.imagen_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {form.imagen_url && (
            <div style={{
              height: '100px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundImage: `url(${form.imagen_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--border)',
            }} />
          )}
        </form>

        <div className="modal-footer-bar">
          <button type="button" className="btn-cancel-modal" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-save-modal"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving && <span className="spinner-sm" />}
            {saving ? 'Guardando…' : especie ? 'Guardar cambios' : 'Crear especie'}
          </button>
        </div>
      </div>
    </div>
  )
}
