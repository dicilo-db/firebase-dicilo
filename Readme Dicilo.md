# Readme Dicilo - Documentación del Proyecto

**Última actualización:** [Fecha de la última modificación]

## 1. Resumen del Proyecto

**Dicilo.net** es un portal de recomendaciones y una plataforma de marketing digital diseñada para conectar empresas de alta calidad con consumidores exigentes. El núcleo de la plataforma es un ecosistema que se basa en la confianza y las recomendaciones auténticas para fomentar el crecimiento mutuo.

La aplicación se divide en dos áreas principales:

1.  **La Plataforma Pública**: Incluye la página de búsqueda con mapa interactivo (`/`), las páginas de aterrizaje personalizadas para clientes (`/[clientSlug]`) y otras páginas de contenido (Vorteile, Pläne, etc.).
2.  **El Panel de Administración (`/admin`)**: Un área segura para gestionar todos los aspectos del contenido de la plataforma, incluyendo empresas, clientes, planes y configuraciones.

---

## 2. Características Técnicas

### 2.1. Stack Tecnológico

Este proyecto está construido con un stack moderno, priorizando el rendimiento, la escalabilidad y una excelente experiencia de desarrollo.

- **Framework Frontend**: **Next.js (App Router)** - Para renderizado del lado del servidor (SSR), generación de sitios estáticos (SSG) y una arquitectura de enrutamiento basada en directorios.
- **Lenguaje**: **TypeScript** - Para añadir tipado estático a JavaScript, mejorando la robustez y mantenibilidad del código.
- **UI y Estilos**:
  - **Tailwind CSS**: Un framework "utility-first" para un estilizado rápido y consistente directamente en el markup.
  - **shadcn/ui**: Una colección de componentes de UI reutilizables, accesibles y personalizables construidos sobre Radix UI y Tailwind CSS.
- **Backend y Base de Datos**: **Firebase**
  - **Firestore**: Base de datos NoSQL en tiempo real para almacenar todos los datos de la aplicación (empresas, clientes, etc.).
  - **Firebase Authentication**: Para la gestión segura de usuarios y roles en el panel de administración.
  - **Firebase Functions**: Para lógica de backend, como la asignación de roles de administrador y la integración con sistemas externos (ERP, N8N).
- **Mapas**: **Leaflet** - Una biblioteca de mapas interactivos de código abierto, integrada en React.
- **Gestión de Formularios**: **React Hook Form** - Para la creación de formularios performantes y flexibles.
- **Validación de Datos**: **Zod** - Para la validación de esquemas tanto en el cliente como en el servidor, asegurando la integridad de los datos.
- **Internacionalización (i18n)**: **i18next** - Para el soporte multilingüe en toda la aplicación, permitiendo traducciones dinámicas.

### 2.2. Versiones Clave

- **Next.js**: `15.3.3`
- **React**: `18.3.1`
- **Firebase**: `11.9.1`
- **TypeScript**: `^5`

---

## 3. Arquitectura y Módulos Principales

### 3.1. Estructura de Directorios Clave

- `src/app`: Contiene todas las rutas y páginas de la aplicación, siguiendo la convención del App Router de Next.js.
  - `src/app/admin`: Todas las rutas y lógica del panel de administración.
  - `src/app/[clientSlug]`: La ruta dinámica que renderiza las páginas de aterrizaje de los clientes.
- `src/components`: Componentes de React reutilizables.
  - `src/components/ui`: Componentes base de shadcn/ui.
- `src/lib`: Funciones de utilidad, configuración de Firebase (`firebase.ts`) y lógica de autenticación (`auth.ts`).
- `src/context`: Lógica para la internacionalización (i18n).
- `src/hooks`: Hooks de React personalizados para lógica compartida (ej. `useAuthGuard`).
- `functions`: El código fuente de las Cloud Functions de Firebase.

### 3.2. Módulo de Búsqueda Principal (`/` y `dicilo-search-page.tsx`)

- **Componentes Clave**: `DiciloSearchPage`, `DiciloMap`, `BusinessCard`.
- **Propósito**: Este es el corazón de la experiencia pública. Permite a los usuarios buscar y descubrir empresas de dos maneras: por nombre de negocio o por ubicación geográfica.
- **Poder y Extensión**:
  - **Poder Actual**: Carga inicial de datos desde el servidor para un rendimiento óptimo (SSR). El mapa interactivo se actualiza en tiempo real según las acciones del usuario. La interfaz es completamente reactiva y está optimizada para móviles.
  - **Posible Extensión**: Se pueden añadir filtros avanzados (por subcategoría, valoraciones, servicios específicos), guardar búsquedas, o incluso integrar una búsqueda por "proximidad a mi ubicación actual" de forma más prominente.

### 3.3. Módulo de Landing Pages de Cliente (`/[clientSlug]`)

- **Componentes Clave**: `ClientLandingPage`, `Tabs`, `TabPanel`.
- **Propósito**: Proporcionar a cada cliente (Retailer o Premium) una página de aterrizaje dedicada, modular y personalizable, completamente independiente de la marca Dicilo.
- **Poder y Extensión**:
  - **Poder Actual**: La estructura es altamente modular. El contenido del encabezado, las tarjetas de información en formato de pestañas y el mosaico de gráficos se gestionan íntegramente desde el panel de administración. El mosaico de gráficos es dinámico y muestra una selección aleatoria en cada carga.
  - **Posible Extensión**: El espacio reservado para "Tickets" es un punto de extensión clave. Se puede integrar un sistema de generación de PDF con códigos QR únicos. Las pestañas de información pueden evolucionar para incluir componentes más complejos, como galerías de vídeo o formularios de contacto específicos para cada sección.

### 3.4. Módulo de Administración (`/admin`)

- **Componentes Clave**: `AdminDashboardPage`, `BusinessesPage`, `ClientsPage`, `EditClientPage`, etc.
- **Propósito**: Es el centro de control de la aplicación. Permite la gestión completa de todos los datos. La autenticación está protegida por roles (`admin`, `superadmin`) verificados tanto en el frontend como en el backend.
- **Poder y Extensión**:
  - **Poder Actual**: Gestión CRUD (Crear, Leer, Actualizar, Borrar) completa para las principales colecciones de datos. El rol de `superadmin` tiene capacidades extendidas, como poblar la base de datos o sincronizar con sistemas externos. El sistema de edición de clientes es muy potente, con una interfaz de pestañas para gestionar contenido complejo.
  - **Posible Extensión**: Se puede añadir un dashboard con analíticas (visitas a landing pages, clics en ofertas). También se podría integrar un sistema de notificaciones para los administradores o un editor visual (WYSIWYG) para el contenido de las tarjetas de información en lugar de texto con formato HTML.
