<template>
  <q-page class="q-pa-md">
    <!-- Banner flotante superior garantizado -->
    <q-banner
      v-if="feedback.show"
      :class="{
        'bg-positive text-white': feedback.type === 'positive',
        'bg-warning text-dark': feedback.type === 'warning',
        'bg-negative text-white': feedback.type === 'negative',
      }"
      class="fixed-top q-ma-md z-max shadow-5 rounded-borders"
      style="max-width: 500px; left: 50%; transform: translateX(-50%)"
    >
      {{ feedback.message }}
    </q-banner>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-bold">Gestión de Prospectos</div>
      <q-btn color="primary" icon="add" label="Nuevo Prospecto" @click="openModal()" />
    </div>

    <!-- Buscador y Filtro -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-sm items-center">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input
            v-model="filters.search"
            dense
            outlined
            placeholder="Buscar por nombre o teléfono..."
            clearable
            @update:model-value="onFilterChange"
          >
            <template v-slot:append><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filters.status"
            dense
            outlined
            :options="statusOptions"
            label="Filtrar por Estado"
            emit-value
            map-options
            clearable
            @update:model-value="onFilterChange"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Tabla -->
    <q-table
      flat
      bordered
      :rows="prospects"
      :columns="columns"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      @request="onRequest"
    >
      <template v-slot:loading>
        <q-inner-loading showing color="primary">
          <q-spinner-dots size="50px" />
        </q-inner-loading>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center q-pa-lg text-grey-7">
          <q-icon name="sentiment_dissatisfied" size="40px" class="q-mr-sm" />
          <span>No se encontraron prospectos con los criterios aplicados.</span>
        </div>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-chip
            :color="getStatusColor(props.value)"
            text-color="white"
            size="sm"
            class="text-weight-bold"
          >
            {{ getStatusLabel(props.value) }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn
            flat
            round
            dense
            color="info"
            icon="visibility"
            :to="{ name: 'prospect-detail', params: { id: props.row.id } }"
          >
            <q-tooltip>Ver Detalle e Historial</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            :disable="props.row.status === 'closed'"
            @click="openModal(props.row)"
          >
            <q-tooltip v-if="props.row.status === 'closed'"
              >No se puede editar un prospecto cerrado</q-tooltip
            >
            <q-tooltip v-else>Editar Prospecto</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Modal Reutilizable -->
    <q-dialog v-model="modal.open" persistent>
      <q-card style="width: 450px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ modal.isEdit ? 'Editar Prospecto' : 'Nuevo Prospecto' }}</div>
          <q-btn icon="close" flat round dense @click="modal.open = false" />
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            v-model="form.name"
            label="Nombre Completo *"
            outlined
            dense
            :error="!!errors.name"
            :error-message="errors.name?.[0]"
          />
          <q-input
            v-model="form.phone"
            label="Teléfono *"
            outlined
            dense
            :error="!!errors.phone"
            :error-message="errors.phone?.[0]"
          />
          <q-input
            v-model="form.email"
            label="Correo Electrónico"
            outlined
            dense
            type="email"
            :error="!!errors.email"
            :error-message="errors.email?.[0]"
          />
          <q-input
            v-model="form.notes"
            label="Observaciones Iniciales"
            outlined
            dense
            type="textarea"
            rows="3"
            :error="!!errors.notes"
            :error-message="errors.notes?.[0]"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Cancelar" color="grey" @click="modal.open = false" />
          <q-btn
            :label="modal.isEdit ? 'Actualizar' : 'Guardar'"
            color="primary"
            :loading="submitting"
            :disable="submitting"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import prospectService from '../services/prospectService'

const prospects = ref([])
const loading = ref(false)
const submitting = ref(false)
const errors = ref({})

// Sistema de feedback visual interno sin dependencias globales
const feedback = ref({ show: false, message: '', type: 'positive' })
const showMessage = (message, type = 'positive') => {
  feedback.value = { show: true, message, type }
  setTimeout(() => {
    feedback.value.show = false
  }, 4000)
}

const filters = reactive({ search: '', status: null })
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 })

const statusOptions = [
  { label: 'Nuevo', value: 'new' },
  { label: 'Contactado', value: 'contacted' },
  { label: 'Cerrado', value: 'closed' },
]

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'phone', label: 'Teléfono', field: 'phone', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  {
    name: 'follow_ups_count',
    label: 'Seguimientos',
    field: (row) => row.follow_ups_count ?? row.follow_ups?.length ?? 0,
    align: 'center',
  },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' },
]

const modal = reactive({ open: false, isEdit: false, prospectId: null })
const form = reactive({ name: '', phone: '', email: '', notes: '' })

const fetchProspects = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      search: filters.search || undefined,
      status: filters.status || undefined,
    }
    const response = await prospectService.getProspects(params)
    const resData = response.data

    if (resData && Array.isArray(resData.data)) {
      prospects.value = resData.data
      pagination.value.page = resData.current_page || 1
      pagination.value.rowsNumber = resData.total || resData.data.length
    } else if (Array.isArray(resData)) {
      prospects.value = resData
      pagination.value.rowsNumber = resData.length
    } else {
      prospects.value = []
    }
  } catch {
    prospects.value = []
  } finally {
    loading.value = false
  }
}

const onFilterChange = () => {
  pagination.value.page = 1
  fetchProspects()
}

const onRequest = (props) => {
  pagination.value.page = props.pagination.page
  fetchProspects()
}

const openModal = (prospect = null) => {
  errors.value = {}
  if (prospect) {
    modal.isEdit = true
    modal.prospectId = prospect.id
    Object.assign(form, {
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email || '',
      notes: prospect.notes || '',
    })
  } else {
    modal.isEdit = false
    modal.prospectId = null
    Object.assign(form, { name: '', phone: '', email: '', notes: '' })
  }
  modal.open = true
}

const handleSubmit = async () => {
  submitting.value = true
  errors.value = {}
  try {
    if (modal.isEdit) {
      await prospectService.updateProspect(modal.prospectId, form)
      modal.open = false
      showMessage('Prospecto actualizado con éxito', 'positive')
    } else {
      await prospectService.createProspect(form)
      modal.open = false
      showMessage('Prospecto creado con éxito', 'positive')
    }

    // Recargamos los datos
    await fetchProspects()
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      showMessage('Verifica los campos obligatorios.', 'warning')
    } else if (err.response?.status === 409) {
      showMessage(err.response.data.message, 'warning')
    } else {
      showMessage('Ocurrió un error al guardar.', 'negative')
    }
  } finally {
    submitting.value = false
  }
}

const getStatusColor = (status) =>
  ({ new: 'blue', contacted: 'orange', closed: 'grey-7' })[status] || 'blue'
const getStatusLabel = (status) =>
  ({ new: 'Nuevo', contacted: 'Contactado', closed: 'Cerrado' })[status] || status

onMounted(() => fetchProspects())
</script>
