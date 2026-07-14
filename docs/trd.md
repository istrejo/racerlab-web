# TRD — RacerLab Web

Documento técnico del frontend Angular de RacerLab. Este repositorio contiene únicamente la aplicación web y debe consumir la API NestJS mediante contratos OpenAPI/Swagger.

## 1. Objetivo técnico

Construir una aplicación web modular, responsive y mantenible para la gestión operativa de un taller mecánico.

El frontend debe resolver la experiencia de usuario para clientes, vehículos, órdenes de servicio, cotizaciones, inventario, técnicos, evidencias y reportes, sin asumir reglas de negocio que pertenecen al backend.

## 2. Stack frontend

| Área | Decisión |
| --- | --- |
| Framework | Angular |
| Lenguaje | TypeScript |
| Componentes | Standalone Components |
| Formularios | Signal Forms cuando sea práctico; Reactive Forms cuando encaje mejor |
| Estado local | Angular Signals |
| Routing | Angular Router con rutas lazy por feature |
| Estilos | Tailwind CSS |
| UI | PrimeNG o componentes propios según conveniencia y accesibilidad |
| Comunicación HTTP | Servicios centralizados + interceptores funcionales |
| API contract | OpenAPI/Swagger generado por `racerlab-api` |

Angular es una decisión adecuada porque RacerLab tendrá formularios complejos, validaciones, tablas, filtros, flujos por estado y pantallas administrativas. El frontend debe priorizar componentes pequeños, tipado estricto y flujos claros.

## 3. Responsabilidad del repositorio

`racerlab-web` es responsable de:

- Aplicación Angular.
- Pantallas y layouts.
- Componentes UI reutilizables.
- Routing, guards e interceptors.
- Servicios HTTP tipados.
- Validaciones de interfaz para feedback inmediato.
- Estado local y coordinación de vistas.
- Assets y configuración de ambientes.

No es responsable de:

- Reglas de negocio críticas.
- Escritura directa en Supabase.
- Decisiones de inventario, cotizaciones u órdenes.
- Autorización real de recursos.
- Definir contratos de API manualmente sin Swagger/OpenAPI.

## 4. Arquitectura de integración

Flujo técnico obligatorio:

```txt
Angular Web App -> NestJS REST API -> Prisma ORM -> Supabase PostgreSQL
                                      -> Supabase Storage
```

El frontend nunca debe conectarse directamente a Supabase para operaciones de negocio. Toda operación crítica debe pasar por `racerlab-api` para aplicar reglas, roles, validaciones, auditoría y seguridad.

## 5. Contrato con backend

El backend es la fuente de verdad del contrato de API.

```txt
NestJS API -> OpenAPI/Swagger -> Angular API Client
```

El frontend debe consumir:

- `openapi.json` o `openapi.yaml` publicado por el backend.
- Servicios HTTP tipados.
- Modelos generados o sincronizados desde el contrato.
- Enums definidos por la API, no duplicados manualmente.

Valores que deben venir del contrato:

```txt
ServiceOrderStatus
QuoteStatus
InventoryMovementType
UserRole
RepairTaskStatus
ProductUnit
```

Esta regla existe para evitar que Angular y NestJS manejen estados o estructuras diferentes. Esto es CLAVE: si duplicás tipos a mano, tarde o temprano rompés el sistema por desincronización.

## 6. Tipo de aplicación

Primera versión:

- Aplicación web responsive.
- Uso principal en laptop o PC del taller.
- Soporte usable para tablet.
- Soporte básico para celular desde navegador.

Futuro:

- Evolucionar a PWA instalable sin desarrollar una app nativa al inicio.

## 7. Estructura sugerida

```txt
racerlab-web/
  docs/
    trd.md
  src/
    app/
      core/
        auth/
        guards/
        interceptors/
        layouts/
        services/
      shared/
        components/
        directives/
        pipes/
        ui/
      features/
        dashboard/
        customers/
        vehicles/
        service-orders/
        quotes/
        inventory/
        technicians/
        reports/
        settings/
    environments/
    assets/
  public/
  angular.json
  package.json
  README.md
```

## 8. Áreas funcionales frontend

| Feature | Responsabilidad UI |
| --- | --- |
| `dashboard` | Métricas operativas, órdenes abiertas, stock bajo, cotizaciones pendientes y técnicos activos. |
| `customers` | Búsqueda, alta/edición, vehículos asociados, historial de órdenes y cotizaciones. |
| `vehicles` | Registro de vehículos, asociación con clientes e historial de servicios. |
| `service-orders` | Creación, detalle, cambios de estado, asignación de técnico, historial y evidencias. |
| `quotes` | Visualización y edición de cotizaciones, ítems, totales, aprobación y rechazo. |
| `inventory` | Productos, categorías, stock, movimientos, reservas y alertas de stock bajo. |
| `technicians` | Carga de trabajo, órdenes asignadas y tareas de reparación. |
| `reports` | Reportes operativos, órdenes, inventario y cotizaciones. |
| `settings` | Usuarios, roles, configuración futura y pantallas administrativas. |

## 9. Autenticación y seguridad en frontend

El frontend debe soportar:

- Login contra `POST /auth/login`.
- Refresh token contra `POST /auth/refresh`.
- Logout contra `POST /auth/logout`.
- Carga de usuario actual desde `GET /auth/me`.
- Guards para rutas privadas.
- Guards o policies de UI para roles.
- Interceptor para agregar `Authorization: Bearer <token>`.
- Manejo centralizado de errores HTTP.

Roles iniciales:

```txt
ADMIN
MANAGER
ADVISOR
TECHNICIAN
INVENTORY_MANAGER
```

La UI puede ocultar acciones según rol, pero esa ocultación no reemplaza la autorización del backend.

## 10. Variables de entorno

Cada ambiente debe configurar:

```txt
API_URL=
APP_NAME=
APP_ENV=
```

Ambientes locales recomendados:

```txt
Frontend: http://localhost:4200
Backend API: http://localhost:3000
Swagger/OpenAPI: http://localhost:3000/docs
Database: Supabase PostgreSQL, accedida solo por backend
Storage: Supabase Storage, autorizado por backend
```

Nunca deben existir en Angular:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## 11. Endpoints consumidos

El frontend consumirá endpoints REST expuestos por `racerlab-api`.

### Auth

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
```

### Customers

```txt
GET /customers
GET /customers/:id
POST /customers
PATCH /customers/:id
DELETE /customers/:id
GET /customers/:customerId/vehicles
```

### Vehicles

```txt
GET /vehicles
GET /vehicles/:id
POST /vehicles
PATCH /vehicles/:id
DELETE /vehicles/:id
```

### Service Orders

```txt
GET /service-orders
GET /service-orders/:id
POST /service-orders
PATCH /service-orders/:id
PATCH /service-orders/:id/status
POST /service-orders/:id/assign-technician
GET /service-orders/:id/history
```

### Quotes

```txt
GET /quotes
GET /quotes/:id
POST /service-orders/:orderId/quotes
PATCH /quotes/:id
POST /quotes/:id/approve
POST /quotes/:id/reject
```

### Inventory

```txt
GET /inventory/products
GET /inventory/products/:id
POST /inventory/products
PATCH /inventory/products/:id
DELETE /inventory/products/:id
POST /inventory/products/:id/movements
GET /inventory/movements
GET /inventory/low-stock
```

### Evidences

```txt
POST /service-orders/:orderId/evidences
GET /service-orders/:orderId/evidences
DELETE /evidences/:id
```

### Reports

```txt
GET /reports/dashboard
GET /reports/orders
GET /reports/inventory
GET /reports/quotes
```

## 12. Manejo de evidencias desde UI

Las fotos y documentos se gestionan desde la UI, pero el backend controla autorización, validación, persistencia y relación con la orden.

Estructura lógica esperada:

```txt
evidences/
  service-orders/
    {orderId}/
      reception/
      diagnosis/
      repair/
      delivery/
```

Ejemplo:

```txt
evidences/service-orders/ORD-000123/diagnosis/photo-001.jpg
```

El frontend solo debe usar endpoints del backend para subir, listar o eliminar evidencias.

## 13. Testing frontend

Pruebas recomendadas:

- Componentes críticos.
- Formularios de clientes, vehículos, órdenes, cotizaciones e inventario.
- Servicios HTTP.
- Interceptors.
- Guards.
- Flujos E2E con Playwright.

Flujos E2E prioritarios:

```txt
Crear cliente
Crear vehículo
Crear orden
Generar cotización
Aprobar cotización
Consumir inventario
Cerrar orden
```

## 14. Entorno local

Comandos sugeridos:

```bash
cd racerlab-web
pnpm install
pnpm start
```

El frontend debe ejecutarse de forma independiente y apuntar al backend local mediante `API_URL`.

## 15. Deploy recomendado

Opciones recomendadas:

- Firebase Hosting.
- Netlify.
- Vercel.

El pipeline del frontend debe ser independiente del backend. El deploy debe configurar `API_URL` según ambiente.

## 16. Estrategia de desarrollo frontend

### Fase 1 — Base del sistema

- Configurar Angular app.
- Configurar layout principal.
- Configurar routing.
- Configurar guards e interceptors.
- Configurar comunicación local con backend.
- Configurar consumo de OpenAPI/Swagger.

### Fase 2 — Operación principal

- Clientes.
- Vehículos.
- Órdenes de servicio.
- Estados.
- Técnicos.
- Dashboard básico.

### Fase 3 — Cotización e inventario

- Productos.
- Categorías.
- Stock.
- Movimientos.
- Cotizaciones.
- Asociación de productos a cotización.
- Reserva/consumo de inventario desde endpoints backend.

### Fase 4 — Reparación y evidencias

- Tareas.
- Comentarios.
- Fotos.
- Control de calidad.
- Cierre de orden.

### Fase 5 — Reportes

- Reporte de órdenes.
- Reporte de inventario.
- Reporte de cotizaciones.
- Métricas del dashboard.

## 17. Recomendación técnica final

Stack recomendado para el MVP frontend:

```txt
Frontend Repository: racerlab-web
Frontend: Angular + TypeScript + Tailwind + PrimeNG
API Contract: OpenAPI / Swagger desde racerlab-api
Testing: Angular testing utilities + Playwright
Deploy: Firebase Hosting / Vercel / Netlify
Package Manager: pnpm
Architecture: Repositorio separado
```

La regla principal de coordinación es mantener el consumo del contrato OpenAPI actualizado. El frontend no debe inventar modelos ni reglas que el backend no expone.
