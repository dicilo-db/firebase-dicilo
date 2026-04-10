# 🌐 DICILO NETZWERK: Ecosistema Digital Integral
**Reporte Maestro de Infraestructura y Funcionalidad**
**Fecha:** 26 de Diciembre, 2025
**Versión del Sistema:** v2.1 (RBAC Integrado)

Este documento consolida la arquitectura completa, la definición del ecosistema y el detalle técnico de los módulos operativos de la plataforma Dicilo.

---

## 1. DEFINICIÓN DEL PRODUCTO: ¿QUÉ ES DICILO?
**Dicilo** no es solo un directorio; es una plataforma híbrida que combina **Búsqueda Hiperlocal**, **Marketing Digital Automatizado** y una **Gig Economy (Economía de Tareas)** descentralizada. Conecta a empresas locales con usuarios finales a través de incentivos gamificados (Puntos y Monedas) y una red de promotores humanos (Freelancers).

### Los 3 Pilares del Ecosistema

#### A. Para las Empresas (B2B - Business Solutions)
Ofrece una presencia digital profesional sin la complejidad técnica.
*   **Gestor de Presencia Multinivel**: Planes Basic, Starter, Retailer y Premium.
*   **Landing Page Builder**: Constructor visual de micrositios con módulos de Video, Galería 3D, Mapas, Reseñas y Ofertas.
*   **Marketing Activo**: Ads Manager (Banners geolocalizados) y Cupones Inteligentes.

#### B. Para los Usuarios (B2C - Social & Gamification)
Transforma la búsqueda de servicios en una experiencia gratificante.
*   **Wallet Digital**: Gestión de **DiciPoints** (fidelidad) y **DiciCoins** (valor transaccional).
*   **Niveles**: Sistema de ranking (Bronce, Plata, Oro) basado en participación.

#### C. Para los Colaboradores (Gig Economy - Freelancers)
Fuerza de ventas descentralizada.
*   **Herramientas de Promoción**: Generador de QRs y campañas de referidos.
*   **Monetización**: Ganancia de comisiones por tráfico y registros generados.

---

## 2. ARQUITECTURA DE ROLES Y PERMISOS (RBAC)
El sistema utiliza una matriz de control de acceso jerárquica y granular.

1.  **Usuario (User)**: Acceso estándar a Búsqueda, Mapa, Perfil y Wallet.
2.  **Freelancer**: Acceso a Herramientas de Promoción y Estadísticas de referidos.
3.  **Team Office**: Rol operativo. Gestiona contenidos, valida reportes y crea productos. Acceso limitado al Admin Panel (sin configuración sensible).
4.  **Admin / Superadmin**: Control total (Economía, Usuarios, Servidores).
    *   *Permisos Granulares*: Capacidad de otorgar privilegios específicos (ej. "Crear QR") a usuarios individuales sin cambiar su rol base.

---

## 3. INVENTARIO DE MÓDULOS (LOS 20 COMPONENTES)
Desglose detallado de las 20 herramientas funcionales activas en el sistema.

### GRUPO A: GESTIÓN DE CLIENTES Y USUARIOS (CRM)
1.  **Módulo Basic (Directorio Gratuito)**: Gestión de empresas con presencia básica y datos de contacto simples.
2.  **Módulo Starter**: Administración de clientes con plan de entrada y límites básicos.
3.  **Módulo Retailer (Comerciantes)**: Funciones específicas para tiendas y comercio local.
4.  **Módulo Premium**: Gestión de clientes VIP con acceso a todas las features avanzadas (Video, 3D, etc.).
5.  **Módulo Private Users (Privatkunden)**: Control total de usuarios finales. Asignación de Roles, Permisos y Bloqueos.
6.  **Módulo Registrations (Validación)**: Sistema de aprobación/rechazo de nuevas solicitudes de empresas.

### GRUPO B: MARKETING Y MONETIZACIÓN
7.  **Módulo Ads Manager**: Sistema de publicidad por banners geolocalizados.
8.  **Módulo Freelancer**: Motor de afiliados, campañas de referidos y tracking de comisiones.
9.  **Módulo Cupones**: Sistema de ofertas y descuentos dinámicos canjeables por QR.
10. **Módulo Recomendaciones**: Gestión de recomendaciones cruzadas en las Landing Pages.

### GRUPO C: ECONOMÍA Y FINANZAS
11. **Módulo DiciCoins (Tokens)**: Gestión de la moneda virtual, historial de compras y saldos.
12. **Módulo DiciPoints (Fidelización)**: Control central de reglas de emisión y valor de los puntos.
13. **Módulo Planes y Precios**: Configuración de suscripciones, pasarelas de pago y contenidos de planes.

### GRUPO D: HERRAMIENTAS Y SOPORTE
14. **Módulo Landing Page Builder**: Editor visual Drag & Drop para personalizar páginas de empresas.
15. **Módulo Ticket System**: Mesa de ayuda centralizada para gestión de incidencias.
16. **Módulo Feedbacks**: Recopilación de opiniones y encuestas de satisfacción.
17. **Módulo Formularios (Forms Dashboard)**: Constructor y gestor de formularios de datos dinámicos.
18. **Módulo AI Chat (Cerebro IA)**: Base de conocimiento para el Asistente Virtual (PDFs/Textos).

### GRUPO E: ADMINISTRACIÓN DEL SISTEMA
19. **Módulo Estadísticas (Analytics)**: Métricas macro de rendimiento, usuarios y crecimiento.
20. **Módulo Super Admin Utils**: Herramientas técnicas (Database Seeding, ERP Sync, Importación Masiva).

---

## 4. ESTRUCTURA DE NAVEGACIÓN (Rutas Clave)

### Públicas
*   `/`: Directorio Principal y Búsqueda.
*   `/client/[slug]`: Perfil de Empresa (Landing Page).
*   `/login` / `/registrieren`: Autenticación y Registro.

### Dashboard Privado (/dashboard)
*   **Overview**: Resumen y Wallet.
*   **Freelancer**: (`/freelancer`) Herramientas de promoción (según rol).
*   **Support**: Gestión de Tickets personales.

### Panel de Administración (/admin)
*   Acceso restringido por Roles.
*   Superadmin ve: Todo.
*   Team Office ve: Gestión de Clientes, Tickets, Ads Manager (Filtrado).

---

## 5. INFRAESTRUCTURA TÉCNICA
*   **Frontend**: Next.js 14 (App Router, Server Actions).
*   **Backend**: Firebase Functions (Serverless).
*   **Base de Datos**: Google Firestore (NoSQL, Real-time).
*   **Autenticación**: Firebase Auth + Custom Claims (RBAC).
*   **IA Stack**: OpenAI API + Vector Database para RAG (Retrieval-Augmented Generation).
