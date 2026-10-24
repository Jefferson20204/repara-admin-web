# RePara Admin Web

Panel administrativo web de RePara, construido con React + TypeScript + Vite. Es una aplicación separada del frontend móvil (React + Capacitor). Consume el backend REST existente; no implementa ni modifica la lógica Java.

## Funcionalidades incluidas

- Inicio de sesión mediante `POST /autenticacion/login`; las rutas del panel requieren JWT.
- Dashboard conectado a `GET /admin/dashboard`, con métricas y gráficos que solo se rellenan con información que reconoce en la respuesta real.
- Postulaciones: listar pendientes y todas, buscar/filtrar, consultar información y enlaces de CV/certificados/documento de identidad, aprobar con `POST /postulaciones/{id}/aprobar` y rechazar con motivo usando `POST /postulaciones/{id}/rechazar`.
- Usuarios: consultar `GET /admin/usuarios`, filtrar por rol y solicitar suspensión por `POST /admin/usuarios/{id}/suspender`.
- Pagos: consultar `GET /admin/pagos`, buscar y exportar los registros recibidos a CSV.
- Notificaciones masivas: formulario conectado a `POST /admin/notificar`, con vista previa.
- Estados de carga, error, vacío, manejo de HTTP 401/403, interfaz responsive y navegación de teclado básica en modales.

## Requisitos

- Node.js 20 o superior recomendado.
- Backend RePara accesible desde el navegador.
- Una cuenta con rol `ADMIN`. El control real de permisos sigue siendo responsabilidad del backend.

## Instalación y ejecución local

```bash
npm install
cp .env.example .env
npm run dev
```

Abrir la URL que indique Vite, normalmente `http://localhost:5173`.

Para compilar producción:

```bash
npm run build
npm run preview
```

## Configuración de API

`VITE_API_BASE_URL` debe incluir el contexto del backend. Por defecto: `http://localhost:8080/api`.

Ejemplo `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
VITE_REJECTION_REASON_FIELD=motivoRechazo
VITE_SUSPENSION_REASON_FIELD=motivoSuspension
VITE_NOTIFICATION_TITLE_FIELD=titulo
VITE_NOTIFICATION_MESSAGE_FIELD=mensaje
```

**Importante:** los nombres de los campos para los cuerpos de rechazo, suspensión y notificación no quedan definidos de forma fiable en el informe disponible: Swagger muestra mapas genéricos `additionalProp1..3`. Los valores del `.env.example` son valores iniciales configurables, no contratos certificados. Verifica el JSON vivo de `/api/v3/api-docs` o los DTO/controladores antes de desplegar. Si los nombres reales son diferentes, cambia las variables anteriores sin modificar el componente visual.

## Contrato usado

| Función | Método y ruta | Observación |
|---|---|---|
| Login | `POST /autenticacion/login` | `correo`, `contrasena`; respuesta con JWT dentro de `datos` |
| Métricas | `GET /admin/dashboard` | Los nombres de propiedades se mapean en `DashboardPage.tsx` |
| Usuarios | `GET /admin/usuarios` | Requiere rol `ADMIN` |
| Suspender usuario | `POST /admin/usuarios/{id}/suspender` | El campo del motivo es configurable y debe verificarse |
| Pagos | `GET /admin/pagos` | Los campos se leen de forma defensiva |
| Postulaciones pendientes | `GET /postulaciones/pendientes` | Requiere autorización administrativa según el informe |
| Todas las postulaciones | `GET /postulaciones/todas` | Requiere autorización administrativa según el informe |
| Aprobar | `POST /postulaciones/{id}/aprobar` | Sin body documentado |
| Rechazar | `POST /postulaciones/{id}/rechazar` | El campo del motivo es configurable y debe verificarse |
| Notificación masiva | `POST /admin/notificar` | El body debe verificarse con el DTO real |

Las rutas de éxito se extraen del envoltorio `{ exito, mensaje, datos }` cuando existe. Las respuestas de error se muestran al usuario en lugar de tratarlas como datos válidos. Los mapeos toleran variaciones de respuesta conocidas, pero **no inventan cifras del dashboard**: si una propiedad no coincide, el panel muestra `—` o un estado vacío.

## Buenas prácticas aplicadas

- UI separada de capa de API (`src/api`), autenticación (`src/auth`), componentes reutilizables y páginas por módulo.
- TypeScript en modo estricto; el contrato aún no confirmado se procesa como `unknown` y se valida antes de leer propiedades.
- Base URL y nombres inciertos de campos configurados con variables de entorno.
- No se crean endpoints ni se modifica el backend.
- JWT guardado en `sessionStorage` para limitar la persistencia al ciclo de pestaña/sesión; usar HTTPS en despliegue y proteger el sitio frente a XSS.
- Sin datos de negocio simulados. Si el backend falla o devuelve una forma distinta, la interfaz comunica el problema.

## Notas de integración y limitaciones conocidas

1. Para que el navegador pueda llamar a Spring Boot, CORS debe permitir el origen del frontend (por ejemplo `http://localhost:5173`).
2. La app presupone que el login devuelve un token bajo `datos.token` (también reconoce `accessToken` o `jwt`). Si el DTO real usa otro nombre, actualizar `src/auth/AuthContext.tsx`.
3. La interfaz de documentos abre las URLs `cvUrl`, `certificadosUrl` y `dniDocumentoUrl` si el backend las devuelve. La carga de archivos no se implementa aquí porque los endpoints revisados exponen URLs y no confirman una ruta multipart.
4. El informe no documenta un endpoint administrativo para crear postulaciones. Los usuarios postulan desde su flujo; el administrador puede ver, aprobar o rechazar. No se agregó una operación de creación ficticia.
5. `GET /admin/dashboard` necesita confirmar los nombres exactos de métricas del JSON. Los alias están en `src/pages/DashboardPage.tsx`.
6. Si Swagger devuelve 403, revisa que la cuenta autenticada tenga rol `ADMIN`; no se debe eliminar el control del backend para hacer funcionar la interfaz.
