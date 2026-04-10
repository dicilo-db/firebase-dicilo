---
description: Implementación del módulo de Freelancers en Dicilo.net
---

# Plan de Implementación: Módulo Freelancer

## 1. Contexto
El objetivo es integrar un módulo completo para freelancers dentro del dashboard existente de Dicilo.net. Este módulo permitirá a los usuarios (freelancers) buscar campañas promocionales, crear contenido personalizado (recomendaciones), programar su difusión en redes sociales y gestionar sus ganancias en un wallet dual (Cash + DiciPoints).

## 2. Arquitectura de Datos (Firestore)

### Nuevas Colecciones:
- `freelancer_profiles`: Perfil específico del usuario con rol freelancer.
    - `userId` (ref a users)
    - `categories` (array de strings)
    - `languages` (array: es, en, de)
    - `location` (geo point / ciudad / país)
    - `stats` (clics totales, ganancias acumuladas, etc.)
    - `status` (active, suspended, pending_approval)

- `campaigns`: Campañas creadas por empresas.
    - `companyId` (ref a companies)
    - `title`
    - `description`
    - `images` (array de urls)
    - `budget_marketing` (float, presupuesto para freelancers)
    - `budget_banners` (float, presupuesto para anuncios)
    - `rate_per_click` (float, pago por clic validado)
    - `categories` (tags)
    - `languages` (target languages)
    - `target_locations` (array de ciudades/países)
    - `status` (active, gray_mode, paused, ended)
    - `gray_mode_trigger` (boolean: true si budget <= 0)

- `promotions`: Instancias de contenido creado por freelancers.
    - `campaignId`
    - `freelancerId`
    - `customText` (texto de la recomendación)
    - `selectedImage`
    - `trackingLink` (generado único)
    - `platform` (facebook, instagram, whatsapp, etc.)
    - `status` (draft, scheduled, published)
    - `scheduledDate` (timestamp)

- `clicks_tracking`: Registro de interacciones.
    - `promoId`
    - `freelancerId`
    - `campaignId`
    - `timestamp`
    - `ip_address` (hash para unicidad)
    - `location` (país/ciudad detectado)
    - `isValid` (boolean, tras fraude check)
    - `payoutAmount` (monto calculado)
    - `platformShare` (40%)
    - `freelancerShare` (60%)

- `wallet_transactions`: Historial financiero.
    - `userId`
    - `type` (EARNING, WITHDRAWAL, CONVERSION)
    - `amount`
    - `currency` (EUR, DICI)
    - `status` (PENDING, CLEARED)
    - `sourceRef` (ref a click o pago)

## 3. Frontend: Estructura del Menú y Navegación

El dashboard se actualizará para incluir una sección "Freelancer" (o "Representante" como en la gráfica) con el siguiente submenú:

1.  **Dashboard**: Resumen general.
2.  **Explorar Campañas (Promo Explorer)**:
    -   **Filtros de Segmentación (Sidebar Izquierdo)**:
        -   Idioma (Switches: ES, EN, DE).
        -   Ubicación (Dropdown: Ciudad, País).
        -   Categorías (Lista seleccionable).
    -   **Lista de Empresas (Sidebar Izquierdo)**: Listado vertical de campañas disponibles con toggle para activar/ver.
3.  **Promo-Composer (Crear Nueva Promoción - Centro)**:
    -   Selección de campaña.
    -   Visualización de imagen del producto.
    -   Editor de texto "Tu Recomendación Personalizada".
    -   Generador de Link de Seguimiento Único.
    -   Botones de compartir (Social Share): WhatsApp, Telegram, Instagram, etc.
    -   Programador (Scheduler): Fecha y hora.
4.  **Vista Previa Móvil (Derecha)**:
    -   Mockup de teléfono mostrando cómo se verá el post en la red social seleccionada.
    -   Call to Action con ganancia estimada.
5.  **Mi Wallet**:
    -   Saldo Cash vs DiciPoints.
    -   Historial de transacciones.
6.  **Estadísticas**:
    -   Gráficos de rendimiento por campaña y ubicación.

## 4. Pasos de Implementación

**Fase 1: Estructura y Navegación (Frontend)**
1.  Crear el componente `FreelancerLayout` o adaptar el `DashboardLayout` actual.
2.  Implementar la Sidebar específica para Freelancers basada en la gráfica (Filtros, Lista de Empresas).
3.  Crear las páginas base: `/dashboard/freelancer`, `/dashboard/freelancer/campaigns`, `/dashboard/freelancer/wallet`.

**Fase 2: Modelo de Datos y Backend**
1.  Definir las interfaces TypeScript para `Campaign`, `FreelancerProfile`, `Promotion`.
2.  Crear scripts o formularios admin para dar de alta campañas de prueba.
3.  Implementar la lógica de lectura de campañas con filtros (Elasticsearch o Firestore Queries avanzadas).

**Fase 3: Promo-Composer y Vista Previa**
1.  Desarrollar el componente central de creación de promociones.
2.  Implementar la vista previa dinámica en el mockup del móvil.
3.  Integrar la generación de links (lógica simulada inicialmente).

**Fase 4: Share & Scheduler**
1.  Conectar botones de compartir con APIs de RRSS o `navigator.share` / `mailto` / Deep links.
2.  Implementar UI del programador de fecha/hora.

**Fase 5: Wallet y Lógica de Negocio**
1.  Implementar vista de Wallet.
2.  Desarrollar lógica de simulación de ganancias (Click -> +Saldo).
3.  Implementar el "Modo Gris" visualmente cuando una campaña no tiene presupuesto.

**Fase 6: Internacionalización y Polish**
1.  Asegurar traducciones (ES, EN, DE) en todos los nuevos componentes.
2.  Refinar estilos CSS para coincidir con la estética "Dark Mode" premium de la gráfica.

## 5. Reglas de Negocio Críticas
- **Split 60/40**: Se aplicará en el backend al validar un clic.
- **Modo Gris**: El frontend debe chequear `campaign.budget > 0` antes de habilitar botones de compartir.
- **Validación de Identidad**: Si gana > 2000 DiciCoins, requerir KYC (ya existe mención en el sistema).

## 6. Siguientes Pasos Inmediatos
1.  Crear la estructura de carpetas para el módulo Freelancer.
2.  Diseñar el `SidebarFreelancer` según la imagen proporcionada.
3.  Crear la vista principal del "Promo-Composer".
