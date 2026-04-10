# ANÁLISIS TÉCNICO: SISTEMA DE DESCUENTOS Y TRANSACCIONES CON CÓDIGO QR

**Fecha:** 23 de Septiembre de 2025
**Propósito:** Este documento describe la arquitectura técnica y el flujo funcional para implementar un sistema de descuentos y registro de transacciones mediante códigos QR. El objetivo es permitir que los clientes finales (B2C) obtengan descuentos en los negocios asociados (B2B) y que ambas partes mantengan un registro de las operaciones.

---

## 1. Visión General del Sistema

El sistema se basa en la interacción entre tres actores principales:

1.  **Cliente B2C (Usuario Final):** Un usuario registrado en la plataforma Dicilo que posee un perfil y un código QR único.
2.  **Cliente B2B (Negocio/Comercio):** Una empresa asociada a Dicilo que ofrece descuentos a los miembros del club.
3.  **Plataforma Dicilo:** El backend que orquesta la validación, aplicación de descuentos y registro de transacciones.

**Flujo de Usuario Simplificado:**

1.  El cliente B2C visita un negocio B2B.
2.  Al momento de pagar, el cliente B2C muestra su código QR personal desde su perfil en la app o web de Dicilo.
3.  El negocio B2B, usando una aplicación específica (la "App de Comercio"), escanea el código QR del cliente.
4.  El sistema valida al cliente, calcula el descuento aplicable y envía una notificación al móvil del cliente B2C para su aprobación.
5.  El cliente B2C aprueba la transacción.
6.  El sistema registra la compra en la base de datos, asociándola tanto al cliente B2C como al negocio B2B.
7.  El pago final se realiza por medios convencionales (efectivo, tarjeta), ya con el descuento aplicado.

---

## 2. Componentes Arquitectónicos

### 2.1. Código QR del Cliente B2C

- **Generación:** Cada vez que se crea un usuario B2C (en la colección `client_users` propuesta en el análisis anterior), se le asignará un **identificador único y seguro (UUID)**. Este UUID será la información contenida en el código QR.
- **Almacenamiento:** El UUID se guardará en el documento del usuario en Firestore (ej. en `client_users/{uid}`).
- **Visualización:** En el perfil del cliente (`/micuenta`), se generará dinámicamente un código QR que contenga su UUID. Este QR se puede mostrar usando una librería como `qrcode.react`. Es crucial que este QR **no contenga información sensible**, solo el identificador.

### 2.2. App de Comercio (para el Cliente B2B)

- **Tecnología:** Para ser ágil, se puede desarrollar como una **Progressive Web App (PWA)** simple y segura, accesible desde un navegador en cualquier dispositivo (móvil, tablet, PC con cámara).
- **Autenticación:** El negocio B2B iniciaría sesión en esta app con sus propias credenciales (las que se definirían en la arquitectura de autogestión de clientes). La app sabrá a qué negocio (`businessId`) pertenece el empleado que está operando.
- **Funcionalidad Principal:**
  - **Escaner QR:** Usaría la cámara del dispositivo para leer el código QR del cliente B2C. Librerías como `react-qr-scanner` pueden facilitar esto.
  - **Input Manual:** Permitiría ingresar el monto total de la compra y, opcionalmente, una breve descripción de los productos.
  - **Interfaz de Estado:** Mostraría en tiempo real el estado de la transacción (escaneando, validando, esperando aprobación del cliente, completada).

### 2.3. Backend (Firebase Functions & Firestore)

Esta es la pieza central que orquesta la lógica.

#### **Nueva Colección en Firestore: `transactions`**

Se creará una nueva colección para almacenar cada operación.

- **ID del Documento:** ID autogenerado por Firestore.
- **Campos:**
  - `b2c_userId` (string): UID del cliente que realiza la compra.
  - `b2b_clientId` (string): ID del documento del negocio en la colección `clients`.
  - `b2b_businessId` (string): ID del documento del negocio en la colección `businesses`.
  - `originalAmount` (number): Monto total de la compra antes del descuento.
  - `discountPercentage` (number): Porcentaje de descuento aplicado (ej. 10 para un 10%).
  - `discountAmount` (number): Monto del descuento en dinero.
  - `finalAmount` (number): Monto final a pagar.
  - `createdAt` (Timestamp): Fecha y hora de la transacción.
  - `status` (string): 'pending', 'approved_by_user', 'completed', 'cancelled'.
  - `itemsDescription` (string, opcional): Descripción de los productos comprados.

#### **Nueva Firebase Function: `processTransaction`**

Esta sería una **Cloud Function "Callable"**, invocada desde la App de Comercio del negocio.

- **Input:** `{ userQRCode: string, purchaseAmount: number, itemsDescription: string }`
- **Lógica:**
  1.  **Autenticación:** Verifica que la llamada provenga de un usuario autenticado (un empleado del negocio B2B).
  2.  **Validación del Cliente:** Busca en la colección `client_users` un usuario cuyo UUID coincida con el `userQRCode` escaneado. Si no existe, devuelve un error.
  3.  **Cálculo del Descuento:** Consulta las reglas de negocio (que podrían estar en el documento del negocio B2B en la colección `clients`) para determinar el porcentaje de descuento aplicable.
  4.  **Notificación al Cliente B2C:** **(Paso Clave)**
      - Utiliza **Firebase Cloud Messaging (FCM)** para enviar una notificación push silenciosa al dispositivo del cliente B2C.
      - La app/web de Dicilo del cliente B2C, al recibir esta notificación, mostraría una pantalla modal nativa (un "prompt") con el mensaje: "El negocio X solicita aprobar una compra de Y€ con un descuento de Z€. ¿Aceptas?".
      - El cliente pulsa "Sí, acepto" o "Cancelar".
  5.  **Creación del Documento de Transacción:**
      - Crea un nuevo documento en la colección `transactions` con el estado inicial `'pending'`.
  6.  **Esperar Aprobación:** La Cloud Function podría usar un mecanismo de espera o, más eficientemente, la App de Comercio podría suscribirse a los cambios del documento de transacción en Firestore para saber cuándo el cliente aprueba.
  7.  **Actualización de Estado:** Cuando el cliente B2C pulsa "Aceptar", su dispositivo llama a otra Cloud Function simple (`approveTransaction`) que actualiza el estado del documento de la transacción a `'approved_by_user'`.
  8.  **Finalización:** La App de Comercio detecta el cambio de estado a `'approved_by_user'`, confirma al cajero que el descuento es válido y que puede proceder con el cobro del monto final. El pago en sí (efectivo, tarjeta) ocurre fuera de la plataforma Dicilo. Una vez cobrado, el cajero podría pulsar "Finalizar" en la App de Comercio, cambiando el estado a `'completed'`.

---

## 3. Integración en los Dashboards

### 3.1. Dashboard del Cliente B2C (`/micuenta`)

- Se añadiría una nueva pestaña o sección llamada "Mi Historial de Compras".
- Esta sección realizaría una consulta a la colección `transactions` en Firestore, filtrando por `b2c_userId == (UID del usuario actual)`.
- Mostraría una tabla o lista con cada compra: fecha, nombre del negocio, monto original, descuento y monto final.

### 3.2. Dashboard del Cliente B2B (Futuro Panel de Negocios)

- Este sería el panel de autogestión para los negocios.
- Incluiría una sección de "Ventas y Transacciones".
- Realizaría una consulta a la colección `transactions` filtrando por `b2b_clientId == (ID del negocio actual)`.
- Mostraría un dashboard con:
  - **KPIs:** Total de ventas, total de descuentos otorgados, número de clientes únicos.
  - **Gráficos:** Ventas a lo largo del tiempo.
  - **Tabla de Transacciones:** Un listado detallado de todas las operaciones realizadas.

---

## 4. Resumen de Flujo de Datos

1.  **B2C App (`/micuenta`)** -> Muestra QR con `user_UUID`.
2.  **B2B App de Comercio** -> Escanea QR -> Envía `{ userQRCode, amount, ... }` a la **`processTransaction`** Cloud Function.
3.  **`processTransaction`** -> Valida, calcula descuento -> Crea doc en `transactions` (status: `pending`) -> Envía notificación FCM al B2C.
4.  **B2C App** -> Recibe FCM -> Muestra modal de aprobación -> Al aceptar, llama a la **`approveTransaction`** Cloud Function.
5.  **`approveTransaction`** -> Actualiza doc en `transactions` a `status: 'approved_by_user'`.
6.  **B2B App de Comercio** (escuchando cambios en Firestore) -> Ve el estado `'approved_by_user'` -> Procede al cobro físico.
7.  **B2C y B2B Dashboards** -> Leen de la colección `transactions` para mostrar historiales y analíticas.

Este sistema, aunque complejo, es modular, seguro y altamente escalable. Separa las responsabilidades y utiliza los servicios de Firebase de manera eficiente para crear una experiencia fluida y en tiempo real.
