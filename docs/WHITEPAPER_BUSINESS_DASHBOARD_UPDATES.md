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
