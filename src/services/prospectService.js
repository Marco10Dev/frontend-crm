import { api } from '../boot/axios'

export default {
  // Listado paginado con filtros de búsqueda y estado
  getProspects(params) {
    return api.get('/prospects', { params })
  },
  // Detalle individual del prospecto con sus seguimientos
  getProspect(id) {
    return api.get(`/prospects/${id}`)
  },
  // Crear prospecto
  createProspect(data) {
    return api.post('/prospects', data)
  },
  // Editar prospecto
  updateProspect(id, data) {
    return api.put(`/prospects/${id}`, data)
  },
  // Agregar un seguimiento
  addFollowUp(prospectId, data) {
    return api.post(`/prospects/${prospectId}/follow-ups`, data)
  },
  // Cerrar prospecto
  closeProspect(prospectId) {
    return api.patch(`/prospects/${prospectId}/close`)
  },
}
