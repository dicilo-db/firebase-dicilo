# Bitácora de Cambios - Dicilo.net

Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---

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
