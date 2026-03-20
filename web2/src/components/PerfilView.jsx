import { useState, useEffect } from 'react'
import { api } from '../api/client.js'

// ─── helpers ────────────────────────────────────────────────────────────────
function Field({ label, value, name, type = 'text', onChange, readOnly = false }) {
  return (
    <div className="pf-field">
      <label className="pf-label">{label}</label>
      {readOnly
        ? <p className="pf-static">{value || <span className="pf-empty">—</span>}</p>
        : <input
            className="pf-input"
            type={type}
            name={name}
            value={value}
            onChange={onChange}
          />
      }
    </div>
  )
}

function Alert({ msg }) {
  if (!msg) return null
  return <p className={`pf-alert ${msg.type}`}>{msg.text}</p>
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PerfilView({ perfil, onPerfilUpdated, onLogout }) {
  // ── Sección activa: 'info' | 'profesional' | 'password' | 'cuenta'
  const [section, setSection]       = useState('info')
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState(null)
  const [confirmDelete, setConfirm] = useState(false)

  const buildForm = (p) => ({
    nombre:           p?.nombre           || '',
    apellido_paterno: p?.apellido_paterno  || '',
    apellido_materno: p?.apellido_materno  || '',
    telefono:         p?.telefono          || '',
    fecha_nacimiento: p?.fecha_nacimiento  || '',
    especialidad:     p?.especialidad      || '',
    grado_academico:  p?.grado_academico   || '',
    institucion:      p?.institucion       || '',
    años_experiencia: p?.años_experiencia  || '',
    numero_cedula:    p?.numero_cedula     || '',
    orcid:            p?.orcid             || '',
    motivacion:       p?.motivacion        || '',
  })

  // Formulario datos personales / profesionales
  const [form, setForm] = useState(() => buildForm(perfil))

  // Sincronizar si perfil llega después del mount
  useEffect(() => {
    if (perfil) setForm(buildForm(perfil))
  }, [perfil])

  // Formulario contraseña
  const [pwForm, setPwForm] = useState({ password_actual: '', password_nuevo: '', confirmar: '' })

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handlePwChange = (e) =>
    setPwForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Guardar datos personales o profesionales
  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      const payload = section === 'info'
        ? { nombre: form.nombre, apellido_paterno: form.apellido_paterno,
            apellido_materno: form.apellido_materno, telefono: form.telefono,
            fecha_nacimiento: form.fecha_nacimiento }
        : { especialidad: form.especialidad, grado_academico: form.grado_academico,
            institucion: form.institucion, años_experiencia: form.años_experiencia,
            numero_cedula: form.numero_cedula, orcid: form.orcid, motivacion: form.motivacion }

      await api.updatePerfil(payload)
      setMsg({ type: 'success', text: 'Perfil actualizado correctamente.' })
      setEditing(false)
      onPerfilUpdated?.()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  // ── Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault(); setMsg(null)
    if (pwForm.password_nuevo !== pwForm.confirmar) {
      setMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' }); return
    }
    if (pwForm.password_nuevo.length < 6) {
      setMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' }); return
    }
    setSaving(true)
    try {
      await api.changePassword({ password_actual: pwForm.password_actual, password_nuevo: pwForm.password_nuevo })
      setMsg({ type: 'success', text: 'Contraseña actualizada. Vuelve a iniciar sesión.' })
      setPwForm({ password_actual: '', password_nuevo: '', confirmar: '' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  // ── Desactivar cuenta
  const handleDelete = async () => {
    setSaving(true); setMsg(null)
    try {
      await api.deletePerfil()
      onLogout?.()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
      setSaving(false)
    }
  }

  const switchSection = (s) => { setSection(s); setEditing(false); setMsg(null) }

  return (
    <div className="pf-layout">

      {/* ── Tabs ── */}
      <div className="pf-tabs">
        {[
          { key: 'info',        label: 'Datos Personales' },
          { key: 'profesional', label: 'Datos Profesionales' },
          { key: 'password',    label: 'Contraseña' },
          { key: 'cuenta',      label: 'Cuenta' },
        ].map(t => (
          <button
            key={t.key}
            className={`pf-tab ${section === t.key ? 'active' : ''}`}
            onClick={() => switchSection(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pf-body">
        <Alert msg={msg} />

        {/* ── Datos Personales ── */}
        {section === 'info' && (
          <>
            <div className="pf-section-header">
              <h3 className="pf-section-title">Información Personal</h3>
              {!editing
                ? <button className="pf-btn-edit" onClick={() => setEditing(true)}>Editar</button>
                : <div className="pf-btn-group">
                    <button className="pf-btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                    <button className="pf-btn-save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
              }
            </div>
            <div className="pf-grid">
              <Field label="Nombre"            name="nombre"           value={form.nombre}           onChange={handleChange} readOnly={!editing} />
              <Field label="Apellido Paterno"   name="apellido_paterno" value={form.apellido_paterno} onChange={handleChange} readOnly={!editing} />
              <Field label="Apellido Materno"   name="apellido_materno" value={form.apellido_materno} onChange={handleChange} readOnly={!editing} />
              <Field label="Teléfono"           name="telefono"         value={form.telefono}         onChange={handleChange} readOnly={!editing} />
              <Field label="Fecha de Nacimiento" name="fecha_nacimiento" value={form.fecha_nacimiento} type="date" onChange={handleChange} readOnly={!editing} />
              <Field label="Correo Electrónico" name="email"            value={perfil?.email || ''} readOnly />
            </div>
          </>
        )}

        {/* ── Datos Profesionales ── */}
        {section === 'profesional' && (
          <>
            <div className="pf-section-header">
              <h3 className="pf-section-title">Perfil Científico</h3>
              {!editing
                ? <button className="pf-btn-edit" onClick={() => setEditing(true)}>Editar</button>
                : <div className="pf-btn-group">
                    <button className="pf-btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                    <button className="pf-btn-save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
              }
            </div>
            <div className="pf-grid">
              <Field label="Especialidad"       name="especialidad"     value={form.especialidad}     onChange={handleChange} readOnly={!editing} />
              <Field label="Grado Académico"    name="grado_academico"  value={form.grado_academico}  onChange={handleChange} readOnly={!editing} />
              <Field label="Institución"        name="institucion"      value={form.institucion}      onChange={handleChange} readOnly={!editing} />
              <Field label="Años de Experiencia" name="años_experiencia" value={form.años_experiencia} onChange={handleChange} readOnly={!editing} />
              <Field label="Cédula Profesional" name="numero_cedula"    value={form.numero_cedula}    onChange={handleChange} readOnly={!editing} />
              <Field label="ORCID"              name="orcid"            value={form.orcid}            onChange={handleChange} readOnly={!editing} />
            </div>
            <div className="pf-field pf-full">
              <label className="pf-label">Motivación</label>
              {!editing
                ? <p className="pf-static">{form.motivacion || <span className="pf-empty">—</span>}</p>
                : <textarea className="pf-textarea" name="motivacion" value={form.motivacion} onChange={handleChange} rows={4} />
              }
            </div>
            <div className="pf-field pf-full">
              <label className="pf-label">Estado de Solicitud</label>
              <span className={`pf-badge ${perfil?.estado_solicitud}`}>{perfil?.estado_solicitud || '—'}</span>
            </div>
          </>
        )}

        {/* ── Contraseña ── */}
        {section === 'password' && (
          <>
            <div className="pf-section-header">
              <h3 className="pf-section-title">Cambiar Contraseña</h3>
            </div>
            <form className="pf-pw-form" onSubmit={handleChangePassword}>
              <div className="pf-field">
                <label className="pf-label">Contraseña actual</label>
                <input className="pf-input" type="password" name="password_actual"
                  value={pwForm.password_actual} onChange={handlePwChange} required />
              </div>
              <div className="pf-field">
                <label className="pf-label">Nueva contraseña</label>
                <input className="pf-input" type="password" name="password_nuevo"
                  value={pwForm.password_nuevo} onChange={handlePwChange} required />
              </div>
              <div className="pf-field">
                <label className="pf-label">Confirmar nueva contraseña</label>
                <input className="pf-input" type="password" name="confirmar"
                  value={pwForm.confirmar} onChange={handlePwChange} required />
              </div>
              <button className="pf-btn-save" type="submit" disabled={saving}>
                {saving ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          </>
        )}

        {/* ── Cuenta ── */}
        {section === 'cuenta' && (
          <>
            <div className="pf-section-header">
              <h3 className="pf-section-title">Gestión de Cuenta</h3>
            </div>
            <div className="pf-danger-zone">
              <div className="pf-danger-info">
                <p className="pf-danger-title">Desactivar cuenta</p>
                <p className="pf-danger-desc">
                  Tu cuenta y perfil de colaborador serán desactivados. No podrás iniciar sesión.
                  Esta acción puede revertirse contactando al administrador.
                </p>
              </div>
              {!confirmDelete
                ? <button className="pf-btn-danger" onClick={() => setConfirm(true)}>
                    Desactivar mi cuenta
                  </button>
                : <div className="pf-confirm">
                    <p className="pf-confirm-text">¿Estás seguro? Esta acción desactivará tu acceso al portal.</p>
                    <div className="pf-btn-group">
                      <button className="pf-btn-cancel" onClick={() => setConfirm(false)}>Cancelar</button>
                      <button className="pf-btn-danger" onClick={handleDelete} disabled={saving}>
                        {saving ? 'Desactivando…' : 'Sí, desactivar'}
                      </button>
                    </div>
                  </div>
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}
