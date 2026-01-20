# ANÁLISIS TÉCNICO: REGISTRO Y GESTIÓN DE CLIENTES

**Fecha:** 22 de Septiembre de 2025
**Propósito:** Este documento describe el estado actual del sistema de registro y propone una arquitectura detallada para evolucionar hacia un modelo de autogestión de clientes con moderación de contenido mediante IA (Genkit).

---

## 1. ESTADO ACTUAL: REGISTRO GESTIONADO POR ADMINISTRADORES

Actualmente, el sistema no permite que los clientes (dueños de negocios) gestionen sus propias landing pages. El flujo es unidireccional y depende completamente de la intervención de un administrador.

### 1.1. Flujo de Registro Actual

1.  **Formulario Público (`/registrieren`):** Un usuario (potencial cliente de tipo "retailer" o "premium") rellena un formulario en la página pública.
2.  **Almacenamiento en Firestore:** Los datos de este formulario (nombre, email, tipo de registro, etc.) se guardan en un nuevo documento dentro de la colección `registrations`.
3.  **Intervención Manual del Administrador:**
    - Un administrador con acceso al panel (`/admin`) debe revisar la colección `registrations`.
    - Si decide aceptar al nuevo cliente, el administrador debe ir a la sección "Gestión de Clientes" (`/admin/clients`) y hacer clic en "Crear Nuevo Cliente".
    - El administrador **copia manualmente** los datos desde la colección `registrations` al nuevo formulario de cliente.
    - Crea y configura la landing page para ese cliente.
4.  **No existe un "login de cliente":** El dueño del negocio no tiene credenciales para acceder a la plataforma y no puede modificar su landing page. Cualquier cambio debe ser solicitado a un administrador de Dicilo.

### 1.2. Separación de Roles Actual

La separación de roles es simple y se basa en el acceso al panel de administración:

- **Usuario Público (Anónimo):** Navega por el sitio, usa el buscador, ve las landing pages y puede rellenar el formulario de registro. No tiene cuenta.
- **Administrador (`admin` / `superadmin`):**
  - Se autentica a través de `/admin`.
  - Tiene acceso completo al dashboard para gestionar **todos** los datos de la plataforma (negocios, clientes, planes, etc.).
  - Es el único que puede crear o modificar las landing pages de los clientes.

**Conclusión del Estado Actual:** El sistema es funcional pero no escalable. Requiere una alta carga de trabajo manual por parte de los administradores y no ofrece autonomía a los clientes.

---

## 2. PROPUESTA DE EVOLUCIÓN: AUTOGESTIÓN DE CLIENTES CON MODERACIÓN IA

Se propone un nuevo sistema que permita a los clientes registrarse, obtener sus propias credenciales de acceso y gestionar su landing page a través de un panel específico para ellos, con todos los cambios de contenido supervisados por un agente de IA.

### 2.1. Arquitectura Propuesta

- **Frontend:** Next.js, React, Shadcn/UI, Tailwind.
- **Backend y Autenticación:** Firebase (Authentication, Firestore, Functions).
- **Moderación de Contenido:** **Genkit** con modelos de Google (Gemini para texto y Visión para imágenes).

### 2.2. Flujo del Nuevo Sistema

#### **Paso 1: Registro del Cliente**

1.  **Nueva Página de Registro de Negocios:** Se crearía una página específica para que los dueños de negocios se registren (ej. `/portal-cliente/registro`).
2.  **Creación de Cuenta en Firebase Auth:** El formulario capturaría el email y contraseña del cliente, y al enviarlo, crearía un nuevo usuario en **Firebase Authentication**.
3.  **Creación de Documentos en Firestore:** Simultáneamente, se crearían dos documentos en Firestore:
    - Un documento en una nueva colección `client_users`, con el **UID del usuario como ID**, que contendría el rol: `{ role: 'cliente' }`.
    - Un documento base en la colección `clients` con la información inicial del negocio y un campo `ownerUid` que almacena el UID del nuevo usuario.

#### **Paso 2: Asignación de Rol de Cliente (Backend)**

1.  **Cloud Function (`onClientUserCreate`):** Se crearía una Firebase Function que se dispare cuando se añade un nuevo documento a la colección `client_users`.
2.  **Establecer Custom Claims:** Esta función leería el rol del documento (`'cliente'`) y usaría el Admin SDK de Firebase para establecer un `custom claim` en el token del usuario: `{ client: true, role: 'cliente' }`. Esto lo identifica de forma segura como un cliente con permisos de edición limitados.

#### **Paso 3: Panel de Autogestión del Cliente**

1.  **Nueva Ruta Protegida (ej. `/micuenta`):** Se crearía un nuevo panel de cliente en esta ruta.
2.  **Hook de Guardia (`useAuthGuard` modificado o nuevo):** Este panel usaría un `AuthGuard` que verifique que el usuario logueado tenga el `custom claim` `role: 'cliente'`. Si no lo tiene, se le deniega el acceso.
3.  **Interfaz de Edición:** Dentro de `/micuenta`, el cliente vería una versión simplificada del formulario de "Editar Cliente" que usan los administradores. La diferencia clave es que este formulario solo podría cargar y modificar **el documento de la colección `clients` que corresponda a su `ownerUid`**.

#### **Paso 4: Proceso de Guardado con Moderación de IA (Genkit)**

Este es el paso crucial para garantizar la calidad del contenido.

1.  **Invocación de un Flujo de Genkit:** Cuando el cliente guarda los cambios en su landing page, el frontend **no escribe directamente en Firestore**. En su lugar, empaqueta todos los datos modificados (textos e imágenes) y los envía a un nuevo flujo de Genkit llamado `moderateLandingPageContent`.

2.  **Flujo `moderateLandingPageContent` en Genkit:**
    - **Input:** El flujo recibiría un objeto con los nuevos textos (títulos, descripciones) y las imágenes (como data URIs).
    - **Proceso de Moderación de Texto:**
      - El flujo pasaría todos los campos de texto a un **prompt de Gemini**.
      - El prompt estaría diseñado para actuar como un moderador de contenido, instruyendo al modelo para que devuelva un veredicto: `{ "isAppropriate": true/false, "reason": "..." }`. Se le indicaría que detecte lenguaje obsceno, ofensivo, spam o fraudulento.
    - **Proceso de Moderación de Imágenes:**
      - Para cada nueva imagen, el flujo la pasaría al **modelo de Visión de Gemini**.
      - El prompt le pediría al modelo que clasifique la imagen y determine si es apropiada para un portal de negocios (detectando violencia, contenido para adultos, etc.). También devolvería un veredicto `{ "isAppropriate": true/false, "reason": "..." }`.
    - **Decisión Final:**
      - Si **tanto el texto como las imágenes** son aprobados por la IA, el flujo de Genkit procedería a escribir los datos en el documento correspondiente de la colección `clients` en Firestore.
      - Si cualquier parte del contenido es rechazada, el flujo **no guardaría nada** y devolvería un error al frontend, explicando el motivo del rechazo (ej. "El texto en la descripción contiene lenguaje inapropiado" o "La imagen cargada no es adecuada").

3.  **Feedback al Cliente:** El frontend recibiría la respuesta del flujo de Genkit y mostraría un mensaje de éxito o un error detallado, permitiendo al cliente corregir su contenido.

### 2.3. Nueva Separación de Roles

Con este sistema, la separación de roles sería mucho más granular y segura:

- **Usuario Público:** Sin cambios.
- **Cliente (`role: 'cliente'`):**
  - Puede iniciar sesión en `/micuenta`.
  - Puede editar **únicamente su propia landing page**.
  - Sus cambios son supervisados por la IA antes de ser publicados.
  - **No tiene acceso** al panel de administración principal (`/admin`).
- **Administrador (`role: 'admin'`):**
  - Puede gestionar todos los negocios y clientes desde `/admin`.
  - Puede **sobrescribir o corregir** los cambios de un cliente si es necesario (por ejemplo, en caso de un falso positivo/negativo de la IA).
- **Superadministrador (`role: 'superadmin'`):**
  - Mismas capacidades que el admin.
  - Acceso a acciones de alto nivel como la sincronización con el ERP o la gestión de los propios administradores.

**Conclusión de la Propuesta:** Esta arquitectura crea un sistema escalable, seguro y moderno. Empodera a los clientes para que gestionen su propio contenido, reduce drásticamente la carga de trabajo de los administradores y utiliza la IA como un guardián de la calidad para proteger la integridad de la plataforma Dicilo.net.
