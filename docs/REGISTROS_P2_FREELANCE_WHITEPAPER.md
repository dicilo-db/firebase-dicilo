# Dicilo.net - Especificación Técnica: Proyecto "Lead Activation Flow" (Registros P2 Freelance)

## 1. Objetivo del Proyecto
Implementar un sistema estructurado de gestión de "paquetes de registros" para freelancers en la plataforma Dicilo.net. A diferencia del modelo manual tradicional, este sistema permite que el freelancer se **auto-asigne paquetes de 50 registros**, los llene, valide y dispare un flujo automatizado de activación mediante doble *opt-in* para los clientes finales. 

El objetivo es garantizar bases de datos completas, pagando al freelancer (Clasificación P2) 0.05 EUR directos a su Tarjeta Verde (Green Card) una vez el cliente final confirme su cuenta.

---

## 2. Estructura de Datos en Firebase Firestore

Los documentos de la colección `businesses` recibirán nuevos atributos de control transaccional:

```json
{
  // ... datos actuales de la empresa ...
  "assignmentStatus": "available", // Estados: ['available', 'assigned', 'filled']
  "verificationStatus": "draft",   // Estados: ['draft', 'pending_client_approval', 'confirmed', 'rejected']
  "assignedTo": null,              // UID del Freelancer (String)
  "assignedAt": null,              // Timestamp de auto-asignación
  "verificationToken": null,       // Hash aleatorio único para el opt-in
  "sentAt": null                   // Timestamp de cuando se envió al cliente
}
```

---

## 3. Arquitectura del Backend (Next.js API & Server Actions)

### A. Auto-Asignación por el Freelancer (Panel Freelancer)
Los freelancers (Promovendedores) gestionarán todo desde su vista en `/dashboard/freelancer`.
- **Restricción de Flujo Constante:** El freelancer solicita un paquete de **50 registros** a la vez.
- **Validación Estricta:** Si el freelancer ya posee registros con estado `assignedStatus == 'assigned'`, el sistema bloqueará la solicitud de un nuevo paquete hasta que envíe a validación o descarte los actuales.
- **Asignación (Backend):** Una Server Action buscará 50 registros con `assignmentStatus == 'available'` y mediante un *Batch Update* registrará el `assignedTo` y `assignedAt`.

### B. Flujo de Validación y Activación (Endpoint API)
Se reutilizará la lógica existente de "empresas huérfanas" adaptándola a este doble opt-in.
- **Ruta:** `src/app/api/verificar/route.ts`
- **Lógica de Rechazo (`?action=deny`):** El cliente declina participar. El registro pasa a `verificationStatus: 'rejected'` y `active: false`.
- **Lógica de Aceptación (`?action=accept`):** 
  1. Verifica el token hash de seguridad.
  2. Convierte o mueve el perfil a la colección `clients` y le otorga acceso al dueño.
  3. Cambia a `active: true` en la plataforma (Aparecerá en el buscador).
  4. **Emisión de Pago:** El backend incrementa en `0.05` el campo `euroBalance` (Tarjeta Verde) del freelancer cuyo ID coincida con `assignedTo`.

---

## 4. Arquitectura del Frontend (UI/UX)

### Panel de Administración (`/admin/dashboard`)
Se aprovechará la tarjeta existente de **Gestión de Promovendedores**. Se sumarán métricas de auditoría:
- Cantidad de registros actualmente asignados vs completados por freelancer.

### Panel del Freelancer (`/dashboard/freelancer/records`)
Una nueva pestaña/sección dedicada a la "Cartera de Registros":
1. **Botón Principal: "Solicitar Nuevo Paquete (50)"** (Se desactiva si hay trabajo pendiente).
2. **Tabla de Registros Pendientes:** Lista las empresas asignadas.
3. **Modal de Edición:** 
   - Exige rellenar todos los campos del **Formulario Básico** actual de la plataforma (Nombre, Email, Teléfono, Categoría, Ciudad, etc.).
   - **Botón "Guardar Borrador"**: Hace un guardado parcial (`draft`).
   - **Botón "Enviar a Cliente"**: Solo activo cuando no falte ningún campo obligatorio. Dispara el token y Webhook.

---

## 5. Integración con Automatización (n8n & Email)

Al hacer clic en "Enviar a Cliente", el backend realizará un POST a la URL de n8n. *(Nota: Inicialmente se configurará con una variable de entorno `process.env.N8N_WEBHOOK_URL` temporal)*.

### Estructura del Payload hacia n8n:
```json
{
  "businessId": "ID_DEL_DOCUMENTO",
  "email": "email_cliente@ejemplo.com",
  "linkAceptar": "https://dicilo.net/api/verificar?action=accept&token=[token]",
  "linkRechazar": "https://dicilo.net/api/verificar?action=deny&token=[token]"
}
```

El flujo automatizado en n8n será responsable de componer el email HTML invitando a la empresa a unirse oficialmente, brindándoles los enlaces de autorización directa generados por el backend de Dicilo.
