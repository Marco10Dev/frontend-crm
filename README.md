
# CRM Frontend (Quasar)

## Versiones y Requisitos
* **Node.js**: >= 18.x
* **NPM** o **Yarn**
* **Quasar CLI**

## Instalación y Configuración
1. Clonar el repositorio y acceder a la carpeta del proyecto.
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
Configurar las variables de entorno creando un archivo .env basado en .env.example:

Fragmento de código
API_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
Rama y Ejecución
Rama de ejecución: feature/frontend-quasar-crm (con Pull Request abierto hacia main).

Arranque del servidor de desarrollo:

Bash
quasar dev
Compilación para producción:

Bash
quasar build
Funcionalidades, Pendientes y Limitaciones
Funcionalidades completadas: Pantalla de listado con tabla Quasar, búsqueda por nombre o teléfono, filtro combinado por estado, paginación conectada a la API, creación y edición mediante diálogo reutilizable, pantalla de detalle con historial de seguimientos ordenados del más reciente al más antiguo, formulario para registrar seguimientos, acción de cierre con confirmación, restricción visual de edición y nuevos seguimientos en prospectos cerrados, manejo de estados de carga, resultados vacíos, errores de validación de backend vinculados a campos y banners flotantes para errores de red o comunicación.

Pendientes: Ninguno dentro del alcance establecido.

Limitaciones: Interfaz acoplada estrictamente a la disponibilidad del backend API REST configurado en el entorno.

Decisión Técnica Relevante
Se estructuraron las llamadas HTTP y la gestión de estados en un módulo composable dedicado usando la Composition API (<script setup>), lo que permitió desacoplar la lógica de comunicación de las vistas visuales y mantener los componentes ligeros y reutilizables.

Herramientas de IA utilizadas
Se utilizó asistencia de Inteligencia Artificial para estructurar la lógica de los composables de consumo HTTP y la validación de formularios reactivos con Quasar.
