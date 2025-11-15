# ANÁLISIS TÉCNICO PROFUNDO: PANEL DE ADMINISTRACIÓN DE DICILO.NET

**Fecha:** 21 de Septiembre de 2025
**Propósito:** Este documento proporciona una descripción técnica exhaustiva y detallada del panel de administración (`/admin`) de la aplicación `dicilo.net`. El objetivo es documentar cada componente, función, estructura de base de datos y flujo de trabajo para permitir su comprensión, mantenimiento y replicación precisa.

---

## 1. Resumen Ejecutivo y Flujo General

El panel de administración es una Single-Page Application (SPA) segura dentro del proyecto Next.js, dedicada a la gestión completa de los contenidos de la plataforma Dicilo.net. Su acceso está restringido por un sistema de roles (`admin`, `superadmin`) basado en Firebase Authentication y Custom Claims.

**Flujo de Usuario:**

1.  Un usuario navega a `/admin`.
2.  Se presenta una página de login.
3.  Tras una autenticación exitosa contra Firebase Auth, el frontend verifica los `custom claims` del usuario.
4.  Si el usuario tiene el rol `admin` o `superadmin`, es redirigido al `/admin/dashboard`.
5.  Si no tiene el rol, se le deniega el acceso y se le desloguea para evitar bucles.
6.  Desde el dashboard, el administrador puede navegar a los diferentes módulos de gestión (CRUD de empresas, clientes, planes, etc.).

---

## 2. Arquitectura Tecnológica

- **Framework:** Next.js (App Router) con React y TypeScript.
- **Autenticación:** **Firebase Authentication** para la gestión de usuarios (email/contraseña).
- **Base de Datos:** **Firestore** (base de datos NoSQL) para almacenar todos los datos de la aplicación.
- **Lógica de Backend:** **Firebase Functions** (Node.js con TypeScript) para tareas automatizadas y seguras, como la asignación de roles y la comunicación con sistemas externos (ERP).
- **Estilos y UI:** Tailwind CSS y `shadcn/ui`.
- **Gestión de Formularios:** `react-hook-form` con `zod` para validación.

---

## 3. Autenticación y Autorización (Paso a Paso)

Este es el pilar de la seguridad del panel.

### 3.1. Proceso de Login (`/admin/page.tsx`)

- Un formulario simple captura email y contraseña.
- Se utiliza la función `signInWithEmailAndPassword` del SDK de Firebase para autenticar al usuario.

### 3.2. Asignación de Roles (Backend)

- **Base de Datos:** Existe una colección en Firestore llamada `admins`.
  - Cada documento en esta colección tiene como **ID el UID del usuario** de Firebase Authentication.
  - Cada documento contiene un campo `role` (string) con el valor `"admin"` o `"superadmin"`.
- **Cloud Function (`onAdminWrite` en `functions/src/index.ts`):**
  - **Disparador:** Esta función se ejecuta automáticamente cada vez que un documento es **creado, actualizado o eliminado** en la colección `admins`.
  - **Función:**
    1.  Obtiene el UID del usuario a partir del documento modificado.
    2.  Lee el campo `role` del documento.
    3.  Utiliza el **Admin SDK de Firebase** para establecer `custom claims` (metadatos seguros) en el token de autenticación del usuario.
    4.  Establece `{ admin: true, role: 'admin' }` o `{ admin: true, role: 'superadmin' }`.
    5.  Si se elimina el rol o el documento, los `custom claims` se anulan (`null`), revocando el acceso.
  - **Importancia:** Este es el único mecanismo seguro para asignar permisos. El cliente **nunca** puede asignarse roles a sí mismo.

### 3.3. Protección de Rutas (Frontend)

- **Hook Personalizado (`hooks/useAuthGuard.ts`):**
  - Todas las páginas del panel de administración (`/admin/dashboard`, `/admin/businesses`, etc.) utilizan este hook.
  - **Función:**
    1.  Escucha los cambios en el estado de autenticación de Firebase.
    2.  Cuando un usuario está logueado, fuerza una recarga de su token con `user.getIdToken(true)` para obtener los `custom claims` más recientes.
    3.  Verifica si `token.claims.admin` es `true` y si `token.claims.role` es uno de los roles permitidos (`'admin'`, `'superadmin'`).
    4.  Si no hay usuario o no tiene los permisos, redirige inmediatamente a la página de login (`/admin`) y muestra un toast de "Acceso denegado".

---

## 4. Estructura de la Base de Datos (Colecciones en Firestore)

- `businesses`: Almacena la información de las empresas que aparecen en el buscador público.
  - **Campos:** `name`, `category`, `description`, `location`, `address`, `coords` (GeoPoint o array `[lat, lon]`), `imageUrl`, `website`, `phone`, `rating`, `currentOfferUrl`, etc.
- `clients`: Almacena los datos de los clientes "premium" o "retailer" que tienen una landing page personalizada.
  - **Campos:** `clientName`, `slug` (para la URL `/client/[slug]`), `clientType` ('retailer'|'premium'), `clientLogoUrl`, y objetos anidados para el contenido dinámico de la landing page como `headerData`, `bodyData`, `infoCards`, `graphics`, `products`.
- `pricing_plans`: Almacena los diferentes planes de precios que se muestran en la página `/planes`.
  - **Campos:** `title`, `price`, `period`, `features` (array de strings), `isPopular` (boolean), `language` ('de'|'en'|'es'), `order` (number).
- `registrations`: Almacena los envíos del formulario de registro de la página `/registrieren`.
  - **Campos:** `firstName`, `lastName`, `email`, `whatsapp`, `registrationType` ('private'|'donor'|'retailer'|'premium'), `createdAt` (Timestamp).
- `feedbacks`: Almacena los envíos del formulario de feedback de la página `/vorteile`.
  - **Campos:** `name`, `email`, `country`, `rating`, `message`, `createdAt` (Timestamp).
- `admins`: (Descrita en la sección de autorización). Crucial para la seguridad.
- `analyticsEvents`: Registra eventos de interacción del usuario desde la página de búsqueda.
  - **Campos:** `type` ('search'|'cardClick'|'popupClick'), `businessId`, `businessName`, `timestamp`.

---

## 5. Módulos del Dashboard (`/admin/dashboard`)

El dashboard es el centro neurálgico desde donde se accede a todas las funcionalidades.

### 5.1. Área de Superadministrador

- **Visibilidad:** Este bloque solo es visible si el `custom claim` del usuario es `role: 'superadmin'`.
- **Funcionalidades:**
  - **Botón "Poblar Base de Datos":**
    - **Acción:** Invoca la Cloud Function `seedDatabaseCallable`.
    - **Cloud Function (`seedDatabaseCallable`):** Inserta un conjunto de datos de prueba (negocios y clientes) predefinidos en el código de la función en las colecciones `businesses` y `clients`. Es una operación segura que solo puede ser ejecutada por un superadmin.
  - **Botón "Sincronizar con ERP":**
    - **Acción:** Invoca la Cloud Function `syncExistingCustomersToErp`.
    - **Cloud Function (`syncExistingCustomersToErp`):**
      1.  Obtiene todos los documentos de la colección `registrations`.
      2.  Para cada documento, envía los datos a un webhook externo (N8N o un ERP).
      3.  La URL del webhook (`ERP_RECEIVER_URL`) y una clave secreta (`ERP_API_KEY`) se configuran como **variables de entorno** en Firebase, no están en el código.
      4.  Solo puede ser ejecutada por un superadmin.

### 5.2. Gestión de Empresas (`/admin/businesses`)

- **Listado (`page.tsx`):** Muestra una tabla con todos los documentos de la colección `businesses`. Incluye un campo de búsqueda para filtrar por nombre en el lado del cliente.
- **Crear (`/new/page.tsx`):** Un formulario para añadir un nuevo documento a la colección `businesses`. Incluye un mapa para geolocalizar la dirección.
- **Editar (`/[id]/edit/page.tsx`):** Un formulario pre-cargado con los datos de un negocio existente para actualizarlo. El mapa muestra la ubicación actual y permite ajustarla arrastrando el marcador.
- **Promover a Cliente:** En la página de edición, un botón invoca la Cloud Function `promoteToClient`. Esta función lee los datos del negocio y crea un nuevo documento en la colección `clients` con una estructura básica, redirigiendo al admin a la página de edición de ese nuevo cliente.

### 5.3. Gestión de Clientes (`/admin/clients`)

- **Listado (`page.tsx`):** Tabla con todos los clientes de la colección `clients`.
- **Editar (`/[id]/edit/page.tsx`):** Este es el módulo más complejo. Es un formulario masivo organizado en pestañas (`<Tabs>`) que permite editar un único documento de cliente. Cada pestaña corresponde a un objeto anidado dentro del documento de Firestore (ej. `headerData`, `bodyData`, `infoCards`).
  - **Lógica de Guardado:** Utiliza `lodash.merge` para fusionar los datos del formulario con los datos existentes en Firestore. Esto es **CRUCIAL** para evitar la sobreescritura y pérdida de datos en sub-campos que no se han modificado.

### 5.4. Otros Módulos de Gestión

- **Planes (`/admin/plans`):** CRUD completo para la colección `pricing_plans`.
- **Feedbacks (`/admin/feedbacks`):** Vista de solo lectura en tiempo real de la colección `feedbacks`.
- **Registros (`/admin/registrations`):** Vista de solo lectura en tiempo real de la colección `registrations`, con filtros por tipo.
- **Estadísticas (`/admin/statistics`):** Dashboard que muestra datos agregados y en tiempo real de la colección `analyticsEvents`.

---

## 6. APIs y Variables de Entorno Clave

- **Cloud Functions:**
  - `ERP_RECEIVER_URL`: URL del webhook para el sistema ERP. **(Secreto)**
  - `ERP_API_KEY`: Clave de API para autenticar las llamadas al ERP. **(Secreto)**
- **API de Geocodificación:**
  - No se requiere clave de API, ya que se utiliza el servicio público de Nominatim/OpenStreetMap. Las llamadas se hacen desde el cliente.

Este análisis proporciona un mapa detallado y preciso para entender y replicar el corazón funcional del panel de administración de `dicilo.net`.
