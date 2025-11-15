# ANÁLISIS TÉCNICO: SISTEMA DE REGISTRO Y GESTIÓN DE ROLES

**Fecha:** 25 de Septiembre de 2025
**Propósito:** Este documento proporciona una descripción técnica exhaustiva y unificada del sistema de registro de usuarios y la gestión de roles (Superadmin, Admin, Cliente, Usuario Público) en la plataforma Dicilo.net. El objetivo es servir como una guía maestra para que cualquier desarrollador o IA pueda comprender, replicar y mantener la arquitectura de autenticación y autorización del proyecto con total precisión.

---

## 1. Visión General del Sistema de Roles

El sistema de acceso de Dicilo.net se basa en una jerarquía de roles clara, implementada a través de **Firebase Authentication** y **Custom Claims**. Los roles definen qué puede hacer cada tipo de usuario en la plataforma.

- **Usuario Público (Anónimo):** Puede navegar por las páginas públicas, usar el buscador y rellenar formularios de contacto o registro. No tiene una cuenta.
- **Cliente (B2B):** Futuro rol. Un dueño de negocio con una cuenta propia para autogestionar su landing page desde un panel específico (`/micuenta`). Sus cambios son moderados por IA.
- **Admin:** Un usuario del equipo de Dicilo que puede acceder al panel de administración (`/admin`) para gestionar el contenido de la plataforma (negocios, clientes, etc.), pero no puede realizar acciones de alto nivel.
- **Superadmin:** Un `Admin` con permisos extendidos. Puede gestionar otros administradores, poblar la base de datos y ejecutar sincronizaciones con sistemas externos (ERP).

---

## 2. Registro y Acceso de Administradores (Admin/Superadmin)

Este es el sistema más crítico para la seguridad y gestión de la plataforma. El acceso al dashboard (`/admin/dashboard`) está estrictamente controlado.

### **Paso 1 (Única vez): Creación del Primer Superadmin**

Para arrancar el sistema, es **absolutamente necesario** crear el primer superadmin de forma manual. No hay un formulario público para esto.

**Instrucciones:**

1.  **Crear el usuario en Firebase Authentication:**
    - Ve a la consola de Firebase del proyecto.
    - Navega a `Authentication` > `Users`.
    - Haz clic en "Add user".
    - Introduce un email (ej. `superadmin@dicilo.net`) y una contraseña segura.
    - **Copia la "User UID"** que se genera para este nuevo usuario. Es una cadena de texto larga y única.

2.  **Asignar el rol en Firestore:**
    - Ve a la consola de Firebase > `Firestore Database`.
    - Localiza la colección `admins`. Si no existe, créala.
    - Dentro de `admins`, haz clic en "Add document".
    - En el campo "Document ID", **pega la "User UID"** que copiaste en el paso anterior.
    - Dentro del documento, añade un único campo:
      - **Field name:** `role`
      - **Type:** `string`
      - **Value:** `superadmin`
    - Guarda el documento.

**¿Qué sucede después de esto?** La creación de este documento dispara automáticamente la Cloud Function `onAdminWrite`.

### **Paso 2 (Automático): La Cloud Function `onAdminWrite`**

Esta es la pieza central de la asignación de roles. Es una función de backend (`functions/src/index.ts`) que se ejecuta automáticamente cada vez que un documento es **creado, actualizado o eliminado** en la colección `admins`.

**Lógica de la Función:**

1.  **Disparador (`onWrite`):** La función se activa con cualquier cambio en `admins/{uid}`.
2.  **Obtener UID:** Extrae el `uid` del usuario del ID del documento modificado.
3.  **Leer Rol:** Lee el campo `role` del documento (`'admin'` o `'superadmin'`).
4.  **Asignar Custom Claims:** Utiliza el **Admin SDK de Firebase** para escribir metadatos seguros directamente en el token de autenticación del usuario. Establece los claims: `{ admin: true, role: 'superadmin' }`.
5.  **Revocar Tokens:** Inmediatamente después de cambiar los claims, la función llama a `revokeRefreshTokens(uid)`. Esto es **CRUCIAL**: fuerza a que el usuario tenga que volver a iniciar sesión o que su token se refresque, asegurando que los nuevos permisos se apliquen de inmediato.
6.  **Manejo de Eliminación/Degradación:** Si se elimina un documento en `admins` o el rol se cambia a algo que no sea `admin` o `superadmin`, la función establece los claims a `null`, revocando efectivamente todos los permisos de administrador.

### **Paso 3 (Frontend): Protección de Rutas con `useAuthGuard`**

El frontend (`/admin/*`) utiliza un hook personalizado (`src/hooks/useAuthGuard.ts`) para proteger las rutas.

**Lógica del Hook:**

1.  **Escuchar Estado de Autenticación:** El hook utiliza `onAuthStateChanged` de Firebase para saber si hay un usuario logueado.
2.  **Forzar Recarga de Token:** Cuando se detecta un usuario, se llama a `user.getIdToken(true)` para forzar la obtención de los `custom claims` más recientes desde el backend de Firebase. Esto evita problemas de caché de permisos.
3.  **Verificación de Roles:** El hook comprueba si los claims del token (`token.claims`) contienen `{ admin: true, role: 'admin' }` o `{ admin: true, role: 'superadmin' }`.
4.  **Acción de Guardia:**
    - **Si el usuario no está logueado o no tiene los roles correctos:** Se le muestra un toast de "Acceso denegado" y se le redirige a la página de login (`/admin`). Crucialmente, se llama a `signOut()` para limpiar cualquier estado de sesión inválido y prevenir bucles de redirección.
    - **Si el usuario tiene los roles correctos:** Se le permite el acceso a la página solicitada.

---

## 3. Registro de Usuarios y Clientes (B2C / B2B)

Este flujo es para los usuarios finales y los dueños de negocios que se registran desde la web pública.

### **Estado Actual (Como está implementado ahora):**

1.  **Formulario Público (`/registrieren`):** Un usuario visita esta página y rellena un formulario simple (nombre, email, tipo de registro, etc.).
2.  **Creación de Documento en Firestore:** Al enviar el formulario, se crea un nuevo documento en la colección `registrations`. **No se crea una cuenta de usuario en Firebase Authentication en este punto.**
3.  **Intervención del Administrador:** Un `admin` debe revisar manualmente la colección `registrations` desde el panel. Si aprueba el registro, debe crear manualmente una entrada en la colección `businesses` o `clients`, copiando los datos. El usuario final no tiene login ni contraseña.

### **Evolución Propuesta (Sistema de Autogestión de Clientes):**

Para permitir que los clientes (negocios B2B) gestionen sus propias landing pages, se propuso una evolución detallada en el documento `ANALISIS_TECNICO_REGISTRO_CLIENTES.md`. Este plan sigue siendo la hoja de ruta recomendada para implementar dicha funcionalidad.

**Resumen del Plan de Evolución:**

1.  **Nuevo formulario de registro para negocios** que cree una cuenta en **Firebase Authentication**.
2.  **Una nueva Cloud Function** que asigne `custom claims` de `{ client: true, role: 'cliente' }` a estos usuarios.
3.  **Un nuevo panel de cliente** en una ruta como `/micuenta`, protegido por un `AuthGuard` que solo permita el acceso a usuarios con el rol `cliente`.
4.  Un **flujo de Genkit para moderar con IA** todos los cambios que el cliente intente guardar en su landing page.

Este enfoque modular garantiza que el sistema de administradores y el futuro sistema de clientes permanezcan seguros y separados, cada uno con sus propios permisos y paneles de control.
