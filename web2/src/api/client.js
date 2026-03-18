const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new Error(data.error || data.message || `Error ${res.status}`)
  }
  return data
}

export const api = {
  // Auth
  login:   (email, password) => request('POST', '/colaboradores/login', { email, password }),
  logout:  ()               => request('POST', '/colaboradores/logout'),
  profile: ()               => request('GET',  '/colaboradores/profile'),

  // Especies
  getEspecies:    ()        => request('GET',    '/especies'),
  createEspecie:  (data)    => request('POST',   '/especies', data),
  updateEspecie:  (id, data) => request('PUT',   `/especies/${id}`, data),
  deleteEspecie:  (id)      => request('DELETE', `/especies/${id}`),

  // Avistamientos
  getAvistamientos: () => request('GET', '/colaboradores/avistamientos'),

  // Lookup
  getEstadosConservacion: () => request('GET', '/estados-conservacion'),
}
