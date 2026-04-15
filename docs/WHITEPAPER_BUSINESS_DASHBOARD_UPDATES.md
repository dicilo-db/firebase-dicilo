# Actualización y Corrección del Dashboard Business (Estadísticas)

## Descripción del Problema
Se reportaron dos incidentes críticos al acceder al panel de estadísticas para negocios (`/dashboard/business/statistics`):

1. **Redireccionamiento Inesperado (Race Condition):** Al ingresar a la página de estadísticas, el sistema mostraba la vista correcta por apenas unos milisegundos y luego redirigía al usuario de manera forzosa al dashboard antiguo (`/dashboard`).
2. **Restricción de Acceso Errónea (Fallback UI):** Durante el breve momento en que la página era visible, se mostraba una alerta amarilla bloqueando el acceso con el mensaje: "El módulo de Estadísticas Avanzadas requiere un plan Retailer o Premium", a pesar de que el usuario contaba con el plan Premium válido.

---

## Soluciones Implementadas

### 1. Corrección de la Condición de Carrera en Autenticación (`useBusinessAccess.ts`)
**Causa:**
El hook encargado de verificar el nivel de acceso del negocio (`useBusinessAccess`) se ejecutaba de manera inmediata sin esperar a que el estado interno de inicialización y verificación de Firebase Auth terminara (`authLoading`). Como el `user` inicial era `null` durante este breve periodo de carga, el sistema asignaba prematuramente `plan: 'none'`. Esto activaba la redirección de seguridad ubicada en `layout.tsx`, enviando al usuario fuera de la zona privada de negocios antes de que se completara la obtención de los datos.

**Solución:**
Se ajustó el gancho (`src/hooks/useBusinessAccess.ts`) para incluir y verificar la bandera `loading` desde `useAuth()`. Ahora el sistema espera de manera pasiva (`if (authLoading) return;`) a que la sesión del usuario esté validada antes de decidir bloquear o redirigir. Se actualizó también el array de dependencias para re-evaluar los permisos apenas Firebase emita la sesión final.

### 2. Flexibilización del Identificador de Acceso (`statistics/page.tsx`)
**Causa:**
Los usuarios directos con membresía **Premium** estaban sufriendo bloqueos porque la página de estadísticas evaluaba de forma restrictiva la existencia de un `businessId` formal (`!businessId`). Dado que los clientes con plan Premium no siempre poseen un `businessId` independiente y sus perfiles analíticos pueden usar su `clientId` (Document ID principal) para albergar las recomendaciones virales e historial, la evaluación original obligaba al fallo.

**Solución:**
Se modificó `src/app/dashboard/business/statistics/page.tsx` para generar un `targetId`. Éste consolida ambos identificadores (`businessId || clientId`), de manera que el sistema acepta correctamente la entrada de clientes orgánicos. Adicionalmente, el `<AdStatistics adId={targetId} />` ahora es inicializado correctamente usando este parámetro unificado, garantizando su visualización.

---

## Archivos Impactados
- `src/hooks/useBusinessAccess.ts`: Añadida protección `authLoading` contra redireccionamientos prematuros.
- `src/app/dashboard/business/statistics/page.tsx`: Lógica de permisos de Plan refactorizada (Implementación de `targetId`).

---

## Anexo: Estructura de Enlaces y Permisos del Dashboard Business

A continuación se detalla la estructura actual de los enlaces disponibles dentro del **Dashboard Business** (`/dashboard/business/*`) según el nivel de acceso (Plan) requerido. Esta documentación sirve como referencia ("blueprint") para futuras integraciones, pruebas o clonación de permisos en nuevos módulos.

### Nivel 1: Plan Basic (Funciones Esenciales y Globales)
Aplica a cualquier usuario que comience su transición a perfil de empresa.
- **Resumen:** `/dashboard/business`
- **Mi Wallet:** `/dashboard/business/financials`
- **Soporte Técnico:** `/dashboard/business/support`
- **FAQs:** `/dashboard/business/faq`

### Nivel 2: Plan Starter (Operaciones y Marketing Inicial)
Incluye lo anterior, más herramientas para gestión de ventas y campañas iniciales.
- **Scanner de Cobros:** `/dashboard/business/scanner`
- **Mis Cupones:** `/dashboard/business/coupons`
- **Gestión de Productos:** `/dashboard/business/products`
- **Inteligencia de Mercado:** `/dashboard/business/market-intelligence`
- **Redes Sociales:** `/dashboard/business/social-media`
- **Geomarketing:** `/dashboard/business/geomarketing`
- **Campañas Personalizadas:** `/dashboard/business/campaigns`
- **Consultas Comerciales:** `/dashboard/business/messages`

### Nivel 3: Plan Retailer (Analítica Avanzada, IA y Proyección)
Incluye lo anterior, además de métricas completas y módulos impulsados por Inteligencia Artificial.
- **Estadísticas (AdStatistics):** `/dashboard/business/statistics`
- **Landing Page (Editor):** `/dashboard/business/editor`
- **Asistente I.A.:** `/dashboard/business/chatbot`
- **Cursos I.A.:** `/dashboard/business/courses`
- **Herramientas Gráficas:** `/dashboard/business/graphics`
- **Captación de Leads:** `/dashboard/business/leads`
- **Soporte Técnico Premium:** `/dashboard/business/support-premium`

### Nivel 4: Plan Premium (Servicios VIP e Integración Total)
Incluye acceso incondicional a todo, más servicios "Done-for-you" y soporte ultra-prioritario.
- **Edición de Gráficos VIP:** `/dashboard/business/graphics-vip`
- **Edición de Textos VIP:** `/dashboard/business/texts-vip`
- **Presentaciones Online:** `/dashboard/business/presentations`
- **Soporte WhatsApp:** `/dashboard/business/whatsapp`
- **Soporte Individual:** `/dashboard/business/support-vip`

*Nota Técnica: Las rutas arriba mencionadas se renderizan y aseguran a través del componente `BusinessSidebar.tsx` (sidebar de usuario) evaluando recursivamente si el `plan` proveído es mayor o igual al `reqLvl` de cada ítem de navegación.*
