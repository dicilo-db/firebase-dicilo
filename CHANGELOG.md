# Bitácora de Cambios - Dicilo.net

# Bitácora de Cambios - Dicilo.net

### **189. FIX: ADS GEOLOCATION & DASHBOARD SPA - CÓDIGO: FIX-ADS-GEO-SPA-V1**
- **Fecha y Hora:** 22 de Diciembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/app/page.tsx`, `Sidebar.tsx`, `PrivateDashboard.tsx`, `TicketsManager.tsx`, `DiciCoinSection.tsx`.
- **Descripción del Cambio:**
  - **Correción Geolocalización Ads:** Se implementó un filtrado estricto en el lado del cliente. Ahora, aunque el servidor envíe todos los anuncios (por fallo de IP), el cliente oculta aquellos fuera del radio GPS del usuario, asegurando que solo se vean anuncios relevantes para su ubicación real.
  - **Dashboard SPA Unificado:** Se consolidaron las secciones "DiciCoin" y "Tickets" dentro del Dashboard principal.
    - Se eliminaron las recargas de página al navegar.
    - Se crearon vistas internas (`DiciCoinSection`, `TicketsManager`) para una experiencia fluida.
    - La Sidebar ahora gestiona estados de vista en lugar de enlaces externos.
- **Resultado:** Publicidad geolocalizada precisa y una experiencia de usuario (UX) en el dashboard mucho más rápida y consistente.

### **182. UPGRADE: REGISTRATION CLEANUP & RESTRUCTURE - CÓDIGO: FIX-REGISTRATIONS-CLEANUP-V1**

- **Fecha y Hora:** 14 de Diciembre de 2025, 16:25 (CET)
- **Módulos Afectados:** `src/app/admin/registrations/page.tsx`, `src/app/actions/registrations.ts`.
- **Descripción del Cambio:**
  - **Limpieza de Base de Datos:** Se implementó una lógica de deduplicación automática (Botón "Cleanup DB") que elimina registros duplicados basándose en el email, conservando el más reciente.
  - **Clasificación Automática:** Todos los registros sin tipo o corruptos se asignan automáticamente a "Basic" (donor), asegurando que ninguna empresa quede en el limbo.
  - **Reestructuración de UI:** Se reformó el módulo de Registros para obligar el orden de pestañas: `Alle -> Basic -> Starter -> Einzelhändler -> Premium -> Privatuser`.
  - **Contadores en Tiempo Real:** Ahora cada pestaña muestra el número exacto de registros activos.
  - **Visibilidad Total:** Se garantiza que la pestaña "Alle" muestre absolutamente todos los registros.
- **Resultado:** Base de datos sanea y gestión de registros transparente y ordenada.

### **183. UPGRADE: STRICT DATABASE SYNC & REGISTRATION ACCOUNTING - CÓDIGO: FIX-REGISTRATIONS-SYNC-V2**
- **Fecha y Hora:** 14 de Diciembre de 2025, 16:45 (CET)
- **Módulos Afectados:** `src/app/actions/registrations.ts`.
- **Descripción del Cambio:**
  - **Sincronización Total (Source of Truth):** Se mejoró la lógica de limpieza para leer la colección `clients` (empresas en landing page) y asegurar que cada una tenga su contraparte en `registrations`. Si falta, se crea automáticamente.
  - **Deduplicación Mejorada:** Algoritmo más agresivo para fusionar registros por Email o Nombre normalizado.
  - **Contabilidad Exacta:** Garantiza que los contadores del panel "Registrierungen" coincidan exactamente con la cantidad de empresas visibles en la web.
  - **Acciones Admin:** Se habilitó menú de "Tres Puntos" en cada registro para:
    - **Empresas:** Gestionar Perfil (Editar) o Eliminar Registro.
    - **Privatuser:** Pausar/Activar Cuenta o Eliminar Registro.

### **187. FIX: WEBPACK CACHE & PORT CONFLICT - CÓDIGO: FIX-CACHE-V1**
- **Fecha y Hora:** 14 de Diciembre de 2025, 20:05 (CET)
- **Módulos Afectados:** Configuración del Entorno local (`.next/cache`).
- **Descripción del Cambio:**
  - **Limpieza de Caché:** Se eliminó la carpeta `.next` para resolver el error `TypeError: Cannot read properties of undefined (reading 'hasStartTime')`.
  - **Reinicio de Puertos:** Se liberaron los puertos 3000 y 3001 terminando los procesos en conflicto.
  - **Restauración Dashboard:** Se añadieron los componentes de error faltantes (`error.tsx`, `not-found.tsx`, `loading.tsx`) en la ruta admin.

### **186. FEAT & FIX: COUPON DOWNLOAD/EMAIL & EDIT FORM - CÓDIGO: FEAT-COUPON-V1**
- **Fecha y Hora:** 14 de Diciembre de 2025, 19:30 (CET)
- **Módulos Afectados:** `src/components/dashboard/ClientCouponManager`, `src/app/admin/clients/[id]/edit/EditClientForm`, `src/lib/email`.
- **Descripción del Cambio:**
  - **Cupones:** Se añadieron botones para descargar cupones como **JPG** y **PDF**, y para **Enviar por Email** directamente desde el panel de administración.
  - **Corrección de Bug:** Se solucionó el error crítico `useFormContext is null` en la página de edición de clientes (`EditClientForm`) envolviendo correctamente el formulario con el proveedor `<Form>`.
  - **Dependencias:** Se añadieron `html2canvas` y `jspdf`.

### **185. REFACTOR: BASIC TIER SYNC & DASHBOARD - CÓDIGO: REF-BASIC-SYNC-V1**
- **Fecha y Hora:** 14 de Diciembre de 2025, 17:35 (CET)
- **Módulos Afectados:** `src/app/admin/dashboard`, `src/app/admin/businesses`, `src/app/actions/registrations`.
- **Descripción del Cambio:**
  - **Dashboard:** Se ha renombrado el módulo "Businesses" a "Basic" y se ha reordenado para aparecer primero. Se ha añadido el contador real de usuarios "Basic" (donor).
  - **Sincronización:** Se ha actualizado `runDatabaseCleanup` para tratar la colección `businesses` como fuente de verdad para Basic, fusionándola con `clients` y deduplicando estrictamente.


### **184. FIX: REGISTRATIONS IMPORT ERROR - CÓDIGO: FIX-REGISTRATIONS-IMPORTS-V1**
- **Fecha y Hora:** 14 de Diciembre de 2025, 17:10 (CET)
- **Módulos Afectados:** `src/app/admin/registrations/page.tsx`.
- **Descripción del Cambio:** Corrección de `ReferenceError: DropdownMenu is not defined`. Se añadieron las importaciones faltantes de `DropdownMenu` y componentes relacionados, así como los iconos y acciones de servidor necesarios.



---

### **181. FEAT: PROXY COUPON REFACTOR - CÓDIGO: FEAT-COUPON-REFACTOR-V1**

- **Fecha y Hora:** 14 de Diciembre de 2025, 12:10 (CET)
- **Módulos Afectados:** `actions/coupons.ts`, `admin/coupons`, `components/dashboard/ClientCouponManager.tsx`.
- **Descripción del Cambio:**
  - **Refactorización Completa:** Unificación del sistema de cupones para permitir control total por parte de Admins y autonomía para Empresas.
  - **Admin Central:** Nuevo panel `/admin/coupons` con tabla de datos unificada, búsqueda global y filtros por estado/mes/país.
  - **Simulación AI:** Generación automática de imágenes de fondo basadas en la categoría del cupón (ej: Gastronomía -> Comida) mediante mapeo de fuentes Unsplash de alta calidad.
  - **Nuevos Campos:** Implementación de `discountType` (%, €, Texto) y `backgroundImage` en el modelo de datos.
  - **UX Empresas:** Tarjetas de cupón mejoradas visualmente y formulario de creación con autocompletado y validación robusta.
- **Resultado:** Arquitectura de cupones escalable, centralizada y visualmente atractiva.

---

### **180. FEAT: COUPON AUTOCOMPLETE & FIXES - CÓDIGO: FEAT-COUPON-AUTOCOMPLETE-V1**

- **Fecha y Hora:** 11 de Diciembre de 2025, 23:45 (CET)
- **Módulos Afectados:** `src/app/admin/coupons/components/CouponForm.tsx`, `src/app/actions/coupons.ts`.
- **Descripción del Cambio:**
  - **Autocomplete:** Se implementó búsqueda de empresas con auto-relleno de datos (Nombre, ID, Ciudad, País).
  - **Mejora de Búsqueda:** Se aumentó el límite de lectura a 2000 registros y se habilitó filtro insensible a mayúsculas para encontrar todas las empresas.
  - **Manual Override:** Se hizo visible el campo `companyId` para permitir la entrada manual en caso de fallo del buscador, desbloqueando la creación de cupones.
  - **Bug Fix:** Se corrigió un error `Info is not defined` por falta de importación.
  - **Build Fix:** Se solucionó "Critical dependency" en `pdf-parse` mediante configuración de Webpack.
  - **i18n Fix:** Se corrigió la interpolación de variables en traducciones (IDs que no se mostraban).
- **Resultado:** Formulario de cupones 100% funcional y robusto.

---

### **179. FEAT: COUPONS MODULE - CÓDIGO: FEAT-COUPONS-V1**

- **Fecha y Hora:** 11 de Diciembre de 2025, 21:00 (CET)
- **Módulos Afectados:** `src/app/admin/coupons`, `src/app/admin/dashboard`, `src/app/actions/coupons.ts`, `src/types/coupon.ts`, `locales/de|en|es/common.json`.
- **Descripción del Cambio:**
  - **Backend:** Implemented `coupons` and `coupon_assignments` collections.
  - **API:** Created Server Actions for Coupon CRUD and Assignment.
  - **UI:** Added Admin Dashboard Card and Sidebar Link through navigation.
  - **UI:** Implemented Category Grid, filtered Listing, and Create/Assign Modals.
  - **i18n:** Added translations for ES, EN, DE.
- **Resultado:** Fully functional coupon management system for administrators.

---

### **178. FEAT: MEJORAS SISTEMA DE TICKETS - CÓDIGO: FEAT-TICKETS-V2**

- **Fecha y Hora:** 11 de Diciembre de 2025, 20:30 (CET)
- **Módulos Afectados:** `src/app/actions/tickets.ts`, `src/app/dashboard/tickets`, `src/app/admin/dashboard`, `src/app/layout.tsx`.
- **Descripción del Cambio:**
  - **Selector de Módulo:** Se añadió un campo desplegable en el formulario de creación de tickets para clasificar el error (AI Chat, Dashboard, etc.).
  - **Admin Dashboard:** Se añadió la tarjeta "Support Tickets" para acceso rápido al sistema.
  - **Server Actions:** Se mejoró la lógica de carga de mensajes (`getTicket`) y envío (`addTicketMessage`) para garantizar la persistencia independientemente de los permisos del cliente.
  - **Correcciones:** Se solucionó error "Could not load default credentials" usando `FIREBASE_SERVICE_ACCOUNT_KEY` y se corrigió JSON inválido en traducciones.
- **Resultado:** Sistema de tickets robusto, traducido y categorizado.

---

### **177. FEAT: AI CHAT MODULE (ADMIN & RAG) - CÓDIGO: FEAT-AICHAT-ADMIN-V1**

- **Fecha y Hora:** 11 de Diciembre de 2025, 08:50 (CET)
- **Módulos Afectados:** `ai-chat`, `AiChatWidget`, `RootLayout`, `actions/chat`, `actions/ai-admin`.
- **Descripción del Cambio:**
  - **Admin AiChat:** Nueva sección `/admin/ai-chat` para subir PDFs y configurar textos de conocimiento.
  - **RAG System:** Implementado sistema de recuperación que lee archivos subidos, snippets de texto y datos de base de datos (Negocios) para enriquecer el contexto de la IA.
  - **Detección de Idioma:** El Chat Widget ahora saluda automáticamente en el idioma del usuario (detectado por IP/Headers).
  - **Soporte PDF:** Integración de `pdf-parse` para lectura automática de documentos subidos.

---

### **176. FIX: CATEGORY VISIBILITY IN PROFILE - CÓDIGO: FIX-PROFILE-CAT-TEXT-V1**

- **Fecha y Hora:** 11 de Diciembre de 2025, 08:30 (CET)
- **Módulos Afectados:** `src/app/dashboard/profile/page.tsx`.
- **Descripción del Cambio:**
  - **Problema:** Los nombres de las categorías en el formulario de perfil no se mostraban (checkboxes sin texto).
  - **Causa:** Desajuste en la propiedad del objeto JSON (`category.name` vs `category.categoria`).
  - **Solución:** Se corrigió el acceso a la propiedad para usar `category.categoria` según la estructura de `categories.json`.
- **Resultado:** Las categorías ahora son visibles y seleccionables correctamente.

---

### **175. FIX: DASHBOARD RUNTIME ERROR & CHAT WIDGET - CÓDIGO: FIX-DASHBOARD-CHAT-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 23:55 (CET)
- **Módulos Afectados:** `src/app/layout.tsx`, `src/app/dashboard/page.tsx`, `src/components/CategoryDirectory.tsx`, `src/i18n.ts`.
- **Descripción del Cambio:**
  - **Dashboard Crash:** Se resolvió un error persistente "Element type is invalid" que bloquéaba el acceso al Dashboard del usuario.
  - **Aislamiento de Error:** Se detectó que el culpable era el componente `AiChatWidget` importado en el `RootLayout`.
  - **Solución Temporal:** Se desactivó el Chat Widget (`<!-- AiChatWidget />`) para restaurar el acceso inmediato al sistema mientras se refactoriza.
  - **Correcciones Menores:**
    - Alineación centrada de iconos en `CategoryDirectory`.
    - Corrección de interpolación de traducciones `{{var}}` en `i18n.ts`.
    - Solución a colisión de nombres en importación de iconos (`User` vs `UserIcon`) en `DashboardPage`.
- **Resultado:** El Dashboard de usuario vuelve a ser 100% funcional y accesible.

---

### **174. FIX: SINCRONIZACIÓN Y CREACIÓN DE PRIVAT USER - CÓDIGO: FIX-PRIV-USER-SYNC-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 18:30 (CET)
- **Módulos Afectados:** `api/register/route.ts`, `api/admin/sync-private-users/route.ts`, `lib/private-user-service.ts`, `admin/private-users/page.tsx`.
- **Descripción del Cambio:**
  - **Automatización:** Se actualizó el proceso de registro para crear automáticamente el perfil de "Privat User" (con código único) al registrarse.
  - **Migración:** Se creó una herramienta de sincronización para importar usuarios privados existentes que estaban en "Registros" pero no tenían perfil activo.
  - **Interfaz:** Se añadió un botón "Import from Registrations" en la lista de Privat User para ejecutar esta sincronización.
  - **Fix:** Start-up config updated to explicitly include Project ID to prevent local dev errors.
- **Resultado:** Los usuarios privados ahora se contabilizan y listan correctamente.

---

### **173. UPDATE: GESTIÓN DE PRIVAT USER - CÓDIGO: UPDATE-PRIV-USER-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 18:13 (CET)
- **Módulos Afectados:** `src/app/admin/private-users/page.tsx`.
- **Descripción del Cambio:**
  - **Cambio de Nombre:** Se renombró la sección de "Privatkunden" a "Privat User".
  - **Navegación:** Se agregó un botón para regresar al Dashboard.
  - **Vista de Lista:** Se mejoró la tabla para mostrar columnas explícitas: Código, Nombre, E-Mail, Intereses y Fecha de ingreso.
  - **Contenido:** Ahora se muestran los intereses del usuario en lugar de solo la cantidad.
- **Resultado:** Mejor usabilidad y claridad en la gestión de usuarios privados.

---

### **172. UPDATE: VISTA DE ADMINISTRADOR DE RECOMENDACIONES - CÓDIGO: UPDATE-REC-ADMIN-VIEW-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 18:00 (CET)
- **Módulos Afectados:** `src/app/admin/recommendations/page.tsx`.
- **Descripción del Cambio:**
  - **Nuevas Columnas:** Se actualizó la tabla de administración para mostrar todos los datos capturados: Teléfono, País, Ciudad, Sitio Web y Comentarios.
  - **Diseño Responsivo:** Se añadió desplazamiento horizontal a la tabla para acomodar las nuevas columnas sin romper el diseño.
  - **Formato:** Se añadieron enlaces clicables para sitios web y truncamiento de texto para comentarios largos.
- **Resultado:** El administrador ahora tiene visibilidad completa de todos los detalles de las recomendaciones enviadas.

---

### **171. FIX: TRADUCCIÓN SELECTOR DE UBICACIÓN - CÓDIGO: FIX-LOC-TRANS-V2**

- **Fecha y Hora:** 10 de Diciembre de 2025, 17:50 (CET)
- **Módulos Afectados:** `locales/de|en|es/common.json`.
- **Descripción del Cambio:**
  - **Traducciones Faltantes:** Se agregó la clave `selectOption` dentro del espacio de nombres `form` para corregir el placeholder "form.selectOption" que aparecía en los selectores de País y Ciudad.
- **Resultado:** Los selectores ahora muestran el texto "Bitte wählen" (DE), "Select an option" (EN) o "Seleccione una opción" (ES) correctamente.

---

### **170. UPDATE: SELECTOR DE PAÍS Y CIUDAD - CÓDIGO: UPDATE-LOCATION-SELECT-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 17:40 (CET)
- **Módulos Afectados:** `src/components/RecommendationForm.tsx`, `package.json`, `locales`.
- **Descripción del Cambio:**
  - **Librería de Datos:** Se implementó `country-state-city` para obtener listados fiables de países y ciudades.
  - **Selectores Dependientes:** El campo "Ciudad" ahora es un menú desplegable que se carga dinámicamente según el "País" seleccionado, evitando errores tipográficos.
  - **Experiencia de Usuario:** Se bloquea el selector de ciudad hasta que se selecciona un país, guiando al usuario.
- **Resultado:** La entrada de datos de ubicación es estandarizada y más sencilla para el usuario.

---

### **169. FIX: REC-FORM UI & Z-INDEX - CÓDIGO: FIX-REC-FORM-UI-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 17:20 (CET)
- **Módulos Afectados:** `src/components/ui/select.tsx`, `src/locales/de/common.json`.
- **Descripción del Cambio:**
  - **Corrección Dropdown:** Se aumentó el `z-index` del componente `SelectContent` a `1001` para asegurar que se despliegue por encima del diálogo modal del formulario.
  - **Textos y Etiquetas:** Se actualizó el texto "Name des Unternehmens" a "Name des Unternehmens, das Sie empfehlen möchten" y se añadieron asteriscos (*) visuales a los campos obligatorios en el idioma alemán.
- **Resultado:** El menú de categorías ahora es accesible y los campos requeridos están claramente marcados.

---

### **168. UPDATE: FORMULARIO DE RECOMENDACIONES (CAMPOS AMPLIADOS) - CÓDIGO: UPDATE-REC-FORM-V2**

- **Fecha y Hora:** 10 de Diciembre de 2025, 17:00 (CET)
- **Módulos Afectados:** `src/components/RecommendationForm.tsx`, `locales/de/common.json`, `locales/en/common.json`, `locales/es/common.json`.
- **Descripción del Cambio:**
  - **Nuevos Campos:** Se amplió el formulario "Unternehmen empfehlen" para incluir: Teléfono, País, Ciudad, Sitio Web y Categoría.
  - **Selector de Categoría:** Se implementó un menú desplegable (Dropdown) con las categorías predefinidas traducidas.
  - **Validación:** Se actualizaron las reglas de validación (Zod) para requerir campos esenciales como País y Ciudad, manteniendo opcionales el Teléfono y el Sitio Web.
  - **Internacionalización:** Se añadieron las claves de traducción correspondientes en Alemán, Inglés y Español.
- **Resultado:** El formulario ahora recoge información más completa para las recomendaciones de empresas.

---

### **167. FIX: PERMISOS DE RECOMENDACIONES - CÓDIGO: FIX-RECOMMENDATIONS-RULES-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 16:30 (CET)
- **Módulos Afectados:** `firestore.rules`.
- **Descripción del Cambio:**
  - **Problema:** Al acceder a `/admin/recommendations`, el sistema devolvía "Missing or insufficient permissions" debido a la falta de una regla específica para la colección `recommendations`.
  - **Solución:** Se añadió una regla de seguridad en Firestore que permite la lectura y eliminación a administradores, y la creación pública (para el formulario).
- **Resultado:** El módulo de recomendaciones ahora carga los datos correctamente sin errores de permisos.

---

### **166. UPDATE: LISTA DE REGISTROS (BASIC & LAYOUT) - CÓDIGO: UPDATE-REGISTRATIONS-UX-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 16:15 (CET)
- **Módulos Afectados:** `src/app/admin/registrations/page.tsx`, `src/locales/es/register.json`, `src/locales/en/register.json`, `src/locales/de/register.json`.
- **Descripción del Cambio:**
  - **Renombrado de Tipo:** Se cambió el nombre visible de la pestaña "Starter" (tipo interno `donor`) a "Basic" en todos los idiomas para reflejar mejor la jerarquía de cuentas.
  - **Mejora de Layout:** Se ajustó la cuadrícula de pestañas (`grid-cols-6`) para acomodar todos los filtros en una sola fila sin que se oculten o salten de línea.
  - **Ordenamiento:** Se reorganizó el orden de las pestañas y se aseguró que el filtro "Starter" (tipo interno `starter`) siga accesible al final de la lista.
- **Resultado:** La lista de registros ahora muestra "Basic", "Retailer", "Premium" de forma ordenada y limpia.

---

### **165. UPDATE: MÓDULO INHALTSVERWALTUNG (DASHBOARD & CLIENTS) - CÓDIGO: UPDATE-INHALT-DASHBOARD-V1**

- **Fecha y Hora:** 10 de Diciembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `src/app/admin/dashboard/page.tsx`, `src/app/admin/clients/page.tsx`, `src/app/admin/registrations/page.tsx`, `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `src/app/admin/recommendations/page.tsx`, `src/types/client.ts`.
- **Descripción del Cambio:**
  - **Reestructuración del Dashboard:** Se reemplazó el diseño antiguo por una cuadrícula de tarjetas separadas por tipo de entidad.
  - **Nuevas Tarjetas:** "Starter Kunden", "Einzelhändler Kunden", "Premium Kunden", "Privat User" (renombrado), "Empfehlungen".
  - **Contadores de 7 Dígitos:** Implementación de contadores en tiempo real (Live Counters) en cada tarjeta para visualizar la cantidad de registros por tipo.
  - **Filtros de Clientes:** Actualización de la página `/admin/clients` para filtrar por tipo (`?type=starter`, `?type=retailer`, `?type=premium`) y adaptación del formulario de edición para soportar el nuevo tipo `starter`.
  - **Registros Centralizados:** Actualización del módulo `Registrierungen` para incluir el tipo `starter` y permitir el filtrado de todos los tipos de registros.
  - **Nuevo Módulo Empfehlungen:** Creación de la página `/admin/recommendations` para gestionar las recomendaciones enviadas.
- **Resultado:** El panel "Inhaltsverwaltung" ahora ofrece una vista desglosada y clara de los diferentes segmentos de clientes y usuarios, facilitando la gestión y el seguimiento de métricas.

---


Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---

---

### **164. FIX: CARGA DE DATOS CLIENTE (LAYOUT & GALERÍA) - CÓDIGO: FIX-CLIENT-DATA-LOAD-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 17:05 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`.
- **Descripción del Cambio:**
  - **Problema:** El formulario de edición no cargaba los campos `layout` y `galleryImages` guardados en base de datos, mostrándolos vacíos y reseteándolos al guardar.
  - **Solución:** Se añadieron estos campos al objeto `preparedData` para asegurar su carga correcta en el estado inicial del formulario.
  - **Resultado:** Los datos de la Landing Page Premium y la galería se visualizan y persisten correctamente.

---

### **163. FIX: WALLET TOP-UP API & EMAIL - CÓDIGO: FIX-WALLET-API-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 16:35 (CET)
- **Módulos Afectados:** `src/app/api/wallet/request-topup/route.ts`, `functions/src/index.ts`.
- **Descripción del Cambio:**
  - **Problema:** Error 500 al solicitar recarga debido a permisos de escritura insuficientes en la API. Además, no se enviaba email.
  - **Solución:**
    1. Se migró la ruta de API a `firebase-admin` para permitir escritura privilegiada en `transaction_requests`.
    2. Se implementó la Cloud Function `notifyAdminOnTopUp` para enviar email automático a `support@dicilo.net` tras cada solicitud.
  - **Resultado:** La solicitud se guarda correctamente y se dispara una alerta por email al administrador.

---

### **162. FEATURE: EDICIÓN MANUAL DE WALLET (ADMIN) - CÓDIGO: FEATURE-WALLET-ADMIN-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 14:45 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`.
- **Descripción del Cambio:**
  - **Problema:** El campo "Werbe-Budget" era estático y no editable en el panel de administración, impidiendo cargar saldo manualmente.
  - **Solución:** Se habilitaron campos numéricos editables para `budget_remaining` y `total_invested` en la pestaña "Wallet" del formulario de edición de cliente.
  - **Resultado:** El administrador ahora puede asignar saldo manualmente tras recibir el pago.

---

### **161. FIX: ERROR CREACIÓN PERFIL PRIVADO - CÓDIGO: FIX-PROFILE-CREATE-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 13:55 (CET)
- **Módulos Afectados:** `src/app/api/private-user/create/route.ts`.
- **Descripción del Cambio:**
  - **Problema:** Los usuarios recibían "Error_Feil_Create_profil" al registrarse o loguearse por primera vez. Esto se debía a que la API usaba el SDK Cliente (`firebase/firestore`) en el servidor, lo que provocaba un rechazo por reglas de seguridad.
  - **Solución:** Se migró la lógica para utilizar `firebase-admin` (SDK Admin), permitiendo escritura privilegiada desde el servidor.
- **Resultado:** La creación de perfiles privados ahora funciona correctamente sin errores de permisos.

### **160. FEATURE: CEREBRO IA Y ACTUALIZACIÓN DE CONOCIMIENTO - CÓDIGO: AI-BRAIN-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 13:15 (CET)
- **Módulos Afectados:** `src/ai/data/dicilo-knowledge.ts`, `functions/dicilo-ai.js`.
- **Descripción del Cambio:**
  - **Base de Conocimiento (Brain):** Se integró un dataset completo de ~460 preguntas y respuestas.
    - 20 preguntas oficiales extraídas de `dicilo.app/faq` (Suscripciones, envíos, seguridad).
    - ~220 preguntas de entrenamiento detallado sobre la marca, el voseo zuliano y la filosofía "Decilo".
    - ~220 ejemplos de intención de usuario para mejorar la detección de búsquedas.
  - **Lógica de Backend (Cloud Functions):** Se generó el código para `searchEmpresas` (búsqueda con filtros), `matchFaq` (similitud semántica) y `recommendEmpresas` (regla estricta de landing+reseñas).
- **Resultado:** La IA ahora cuenta con un contexto profundo sobre la plataforma y reglas claras de negocio.

### **159. FEATURE: MÓDULO DE PUBLICIDAD Y WALLET - CÓDIGO: ADS-WALLET-V1**

- **Fecha y Hora:** 05 de Diciembre de 2025, 11:30 (CET)
- **Módulos Afectados:** `src/app/page.tsx`, `src/components/dicilo-search-page.tsx`, `src/components/dashboard/WalletCard.tsx`.
- **Descripción del Cambio:**
  - **Publicidad Nativa (Ads):** Implementación de inyección de anuncios cada 10 tarjetas de empresa en el listado principal. Los anuncios respetan el diseño visual de las tarjetas de negocio y se etiquetan según el idioma del usuario.
  - **Sistema de Wallet:** Creación de un sistema de saldo prepago (Wallet) para clientes.
    - Se añadió `budget_remaining` y `total_invested` al modelo de datos de cliente.
    - Se creó el componente `WalletCard` en el dashboard del cliente para visualizar el saldo restante ("Tanque de gasolina") y solicitar recargas.
  - **Transacción Segura (CPV):** Implementación de la API `/api/ads/view` que descuenta saldo de forma transaccional solo cuando el anuncio es visible (IntersectionObserver > 50%).
  - **Admin:** Integración del tab "Wallet" en el formulario de edición de clientes (`EditClientForm`).
- **Resultado:** El sistema ahora muestra publicidad pagada de forma dinámica y permite a los clientes gestionar su presupuesto publicitario.

---

### **158. FIX: BOTÓN DE CERRAR MAPA EN MÓVIL - CÓDIGO: FIX-MAP-CLOSE-BTN-V1**

- **Fecha y Hora:** 03 de Diciembre de 2025, 14:55 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Problema:** El botón para cerrar la vista de mapa en dispositivos móviles quedaba oculto detrás de las capas del mapa (Leaflet) o parpadeaba al interactuar, debido a un índice de apilamiento (`z-index`) insuficiente.
  - **Solución:** Se aumentó el `z-index` del botón a `2000` y se añadió una sombra (`shadow-md`) para garantizar que siempre permanezca visible y accesible por encima de cualquier elemento del mapa.
  - **Resultado:** El botón de cierre es ahora perfectamente visible y funcional en todo momento.

### **157. FIX: ERROR DE MAPA EN MÓVIL Y VALIDACIÓN DE COORDENADAS - CÓDIGO: FIX-MAP-NAN-V1**
...
