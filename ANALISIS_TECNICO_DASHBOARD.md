# Guía Detallada para Recrear el Dashboard de Administración de Dicilo.net

Este documento describe la estructura y el orden de creación de cada módulo del panel de administración (/admin).

---

## Paso 0: La Base - Autenticación y Acceso Seguro

Antes de crear cualquier página, se debe construir la puerta de acceso.

1.  Página de Login (`/admin/page.tsx`):
    - Propósito: Es la única puerta de entrada.
    - Lógica: Un formulario simple que usa `signInWithEmailAndPassword` de Firebase para autenticar. Implementa la función de "recuperar contraseña" con `sendPasswordResetEmail`.

2.  Cloud Function `onAdminWrite` (en `functions/src/index.ts`):
    - Propósito: Asignar roles de forma segura.
    - Lógica: Se dispara automáticamente cuando un documento se crea o cambia en la colección `admins` de Firestore. Lee el rol (`admin` o `superadmin`) y lo "incrusta" en el token del usuario como un `custom claim`. Es el cerebro de la seguridad.

3.  Hook `useAuthGuard` (en `hooks/useAuthGuard.ts`):
    - Propósito: El "guardia de seguridad" de cada página del panel.
    - Lógica: Este hook se coloca en cada página que se quiere proteger. Verifica si el usuario logueado tiene el `custom claim` de `admin` o `superadmin`. Si no lo tiene, lo expulsa a la página de login.

---

## Paso 1: El Centro de Mando - Dashboard Principal (`/admin/dashboard`)

Una vez que el acceso está asegurado, se crea la página principal del panel.

- Archivo: `/admin/dashboard/page.tsx`
- Propósito: Dar la bienvenida al administrador y servir como centro de navegación.
- Componentes Clave:
  1.  Mensaje de Bienvenida: Muestra el email y el rol del usuario (`admin` o `superadmin`).
  2.  Área de Superadministrador (Visible solo para `superadmin`):
      - Botón "Poblar Base de Datos": Llama a la Cloud Function `seedDatabaseCallable` para insertar datos de prueba.
      - Botón "Sincronizar con ERP": Llama a la Cloud Function `syncExistingCustomersToErp` para enviar los registros al sistema externo.
  3.  Navegación Principal: Una serie de botones (links) que llevan a los diferentes módulos de gestión.

---

## Paso 2: Módulos de Gestión (CRUD - Crear, Leer, Actualizar, Borrar)

Estos son los módulos para manejar las diferentes colecciones de datos en Firestore. Todos siguen un patrón similar.

### A. Gestión de Empresas (`/admin/businesses`)

- Colección de Firestore: `businesses`
- Páginas:
  1.  Listado (`/admin/businesses/page.tsx`): Muestra una tabla con todas las empresas. Incluye un campo de búsqueda para filtrar y botones para "Editar" y "Borrar" cada fila. Un botón "Añadir Nuevo" lleva al formulario de creación.
  2.  Crear (`/admin/businesses/new/page.tsx`): Un formulario para añadir una nueva empresa. Incluye campos para todos los datos y un mapa interactivo para geolocalizar la dirección.
  3.  Editar (`/admin/businesses/[id]/edit/page.tsx`): Es el mismo formulario que el de crear, pero se carga con los datos de una empresa existente. Permite modificar los datos y la ubicación en el mapa. Incluye el botón "Promover a Cliente" que llama a la Cloud Function `promoteToClient`.

### B. Gestión de Clientes (`/admin/clients`)

- Colección de Firestore: `clients`
- Páginas:
  1.  Listado (`/admin/clients/page.tsx`): Tabla que lista todos los clientes (los que tienen landing pages). Permite buscar, editar y eliminar.
  2.  Crear (`/admin/clients/new/page.tsx`): Formulario para crear un cliente desde cero.
  3.  Editar (`/admin/clients/[id]/edit/page.tsx`): El módulo más complejo. Usa un componente `EditClientForm.tsx`.
      - Estructura: Organizado en pestañas (`<Tabs>`) que corresponden a los objetos anidados en el documento de Firestore (General, Marquesina, Cuerpo, Info-Cards, etc.).
      - Lógica Clave: Al guardar, no actualiza directamente. Primero, lee la versión más reciente del documento en Firestore y luego usa `lodash.merge` para fusionar los datos nuevos con los viejos, evitando así la pérdida de datos en campos que no se modificaron.

### C. Gestión de Planes de Precios (`/admin/plans`)

- Colección de Firestore: `pricing_plans`
- Estructura: Sigue el mismo patrón CRUD que "Empresas" (listado, crear, editar).

---

## Paso 3: Módulos de Visualización de Datos (Solo Lectura)

Estos módulos sirven para que el administrador pueda consultar datos que los usuarios generan desde la página pública.

- Registros (`/admin/registrations/page.tsx`):
  - Colección de Firestore: `registrations`
  - Lógica: Se conecta a Firestore en tiempo real (`onSnapshot`) para mostrar una tabla con todos los envíos del formulario de registro. Incluye pestañas para filtrar por tipo (`private`, `donor`, `retailer`, `premium`).

- Feedbacks (`/admin/feedbacks/page.tsx`):
  - Colección de Firestore: `feedbacks`
  - Lógica: Similar al de registros, muestra en tiempo real todos los comentarios y valoraciones enviados por los usuarios.

- Estadísticas (`/admin/statistics/page.tsx`):
  - Colección de Firestore: `analyticsEvents`
  - Lógica: Muestra tarjetas con KPIs (Indicadores Clave de Rendimiento) como "Total Búsquedas", "Total Clics", etc. Estos se calculan con `getCountFromServer`. También muestra una tabla con los últimos eventos de analítica en tiempo real.

- Dashboard de Formularios (`/admin/forms-dashboard/page.tsx`):
  - Colecciones de Firestore: `recommendations` y `recommendation_tasks`
  - Lógica: Es un dashboard especializado que agrega y muestra los datos del sistema de recomendaciones. Muestra KPIs sobre recomendaciones enviadas, aceptadas, etc., y tablas para ver en detalle quién recomienda y quién es recomendado.

---

Siguiendo este orden (Autenticación -> Dashboard Principal -> Módulos CRUD -> Módulos de Visualización), se puede reconstruir el panel de administración de forma lógica y estructurada.
