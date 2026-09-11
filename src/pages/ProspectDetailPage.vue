<template>
  <q-page class="q-pa-md">
    <!-- Banner flotante superior asegurado -->
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

    <q-btn
      flat
      icon="arrow_back"
      label="Volver al Listado"
      :to="{ name: 'prospects-list' }"
      class="q-mb-md"
    />

    <q-inner-loading :showing="loading" color="primary">
      <q-spinner-dots size="50px" />
    </q-inner-loading>

    <div v-if="prospect" class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6 text-bold">{{ prospect.name }}</div>
              <q-chip
                :color="getStatusColor(prospect.status)"
                text-color="white"
                class="text-weight-bold"
              >
                {{ getStatusLabel(prospect.status) }}
              </q-chip>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-sm text-subtitle2">
            <div>
              <q-icon name="phone" color="primary" class="q-mr-xs" /> <strong>Teléfono:</strong>
              {{ prospect.phone }}
            </div>
            <div>
              <q-icon name="email" color="primary" class="q-mr-xs" /> <strong>Correo:</strong>
              {{ prospect.email || 'N/A' }}
            </div>
            <div>
              <q-icon name="notes" color="primary" class="q-mr-xs" />
              <strong>Observaciones:</strong> {{ prospect.notes || 'Sin observaciones' }}
            </div>
          </q-card-section>

          <q-card-actions v-if="prospect.status !== 'closed'" align="right" class="q-pa-md">
            <q-btn color="negative" icon="lock" label="Cerrar Prospecto" @click="confirmClose" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-mb-md">
          <q-card-section><div class="text-h6">Registrar Nuevo Seguimiento</div></q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner
              v-if="prospect?.status === 'closed'"
              class="bg-grey-3 text-grey-8 rounded-borders q-mb-sm"
            >
              <template v-slot:avatar><q-icon name="info" color="grey-8" /></template>
              Este prospecto está cerrado. No es posible agregar más seguimientos.
            </q-banner>

            <!-- Selector de Tipo -->
            <q-select
              v-model="followUpForm.type"
              :options="typeOptions"
              label="Tipo de Seguimiento *"
              outlined
              dense
              emit-value
              map-options
              class="q-mb-md"
              :error="!!errors.type"
              :error-message="errors.type?.[0]"
              :disable="prospect?.status === 'closed' || submittingFollowUp"
            />

            <!-- Campo de Texto -->
            <q-input
              v-model="followUpForm.notes"
              outlined
              type="textarea"
              rows="3"
              placeholder="Escribe la nota del seguimiento..."
              :disable="prospect?.status === 'closed' || submittingFollowUp"
              :error="!!errors.notes"
              :error-message="errors.notes?.[0]"
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              color="secondary"
              icon="send"
              label="Guardar Seguimiento"
              :disable="prospect.status === 'closed' || submittingFollowUp"
              :loading="submittingFollowUp"
              @click="submitFollowUp"
            />
          </q-card-actions>
        </q-card>

        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Historial de Seguimientos ({{ sortedFollowUps.length }})</div>
          </q-card-section>
          <q-separator />

          <q-card-section>
            <div v-if="sortedFollowUps.length === 0" class="text-grey-6 text-center q-pa-md">
              Aún no hay seguimientos registrados.
            </div>

            <q-timeline color="secondary" v-else>
              <q-timeline-entry
                v-for="item in sortedFollowUps"
                :key="item.id"
                :title="formatDate(item.created_at)"
                icon="forum"
              >
                <div class="text-body2">{{ item.notes }}</div>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import prospectService from '../services/prospectService'

const route = useRoute()

const prospect = ref(null)
const loading = ref(true)

// Estado para mensajes en la interfaz en lugar de Notify

const feedback = ref({ show: false, message: '', type: 'positive' })

const showMessage = (message, type = 'positive') => {
  feedback.value = { show: true, message, type }
  setTimeout(() => {
    feedback.value.show = false
  }, 4000)
}

const followUpForm = reactive({
  type: 'call',
  notes: '',
})

const submittingFollowUp = ref(false)
const errors = ref({})

const sortedFollowUps = computed(() => {
  if (!prospect.value?.follow_ups) return []
  return [...prospect.value.follow_ups].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )
})

const loadProspect = async () => {
  loading.value = true
  try {
    const response = await prospectService.getProspect(route.params.id)
    prospect.value = response.data || response
  } catch (err) {
    showMessage(err.response?.data?.message || 'Error al cargar los datos', 'negative')
  } finally {
    loading.value = false
  }
}

const submitFollowUp = async () => {
  submittingFollowUp.value = true
  errors.value = {}
  try {
    const response = await prospectService.addFollowUp(route.params.id, followUpForm)
    showMessage('¡Seguimiento registrado con éxito!', 'positive')

    followUpForm.notes = ''
    followUpForm.type = 'call'

    const newFollowUp = response.data || response
    if (newFollowUp && typeof newFollowUp === 'object') {
      if (!prospect.value.follow_ups) prospect.value.follow_ups = []
      prospect.value.follow_ups.unshift(newFollowUp)
    } else {
      await loadProspect()
    }
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      showMessage('Revisa los campos obligatorios.', 'warning')
    } else if (err.response?.status === 409) {
      showMessage(err.response.data.message, 'warning')
    } else {
      showMessage('Error al registrar el seguimiento.', 'negative')
    }
  } finally {
    submittingFollowUp.value = false
  }
}

const confirmClose = () => {
  if (window.confirm('¿Estás seguro de cerrar este prospecto? Esta acción no se puede deshacer.')) {
    closeProspectAction()
  }
}

const closeProspectAction = async () => {
  try {
    await prospectService.closeProspect(route.params.id)
    showMessage('Prospecto cerrado exitosamente', 'positive')
    setTimeout(() => window.location.reload(), 1000)
  } catch (err) {
    showMessage(err.response?.data?.message || 'Error al cerrar el prospecto', 'negative')
  }
}

const typeOptions = [
  { label: 'Llamada', value: 'call' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Visita', value: 'visit' },
]
const formatDate = (dateString) => new Date(dateString).toLocaleString()
const getStatusColor = (status) =>
  ({ new: 'blue', contacted: 'orange', closed: 'grey-7' })[status] || 'blue'
const getStatusLabel = (status) =>
  ({ new: 'Nuevo', contacted: 'Contactado', closed: 'Cerrado' })[status] || status

onMounted(() => loadProspect())
</script>
