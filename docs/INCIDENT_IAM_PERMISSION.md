# 🚨 Incidente: Error de Permisos IAM en Registro (Service Usage Consumer)

**Fecha:** 30 de Marzo de 2026  
**Estado:** PENDIENTE DE REVISIÓN  
**Afectación:** Página de Registro (`/registrieren`) bloqueada. Los usuarios nuevos y la creación de perfiles privados/empresas están fallando en Producción/Localhost.

## 📌 Descripción del Problema
Cuando un usuario intenta completar su registro en `dicilo.net/registrieren` (o en su contraparte local), aparece de repente un globo rojo (Toast) con un mensaje de error extenso emitido directamente por la API de Google Cloud (`identitytoolkit.googleapis.com`):

```json
"error": {
  "status": "PERMISSION_DENIED",
  "message": "Caller does not have required permission to use project geosearch-fq4i9. Grant the caller the roles/serviceusage.serviceUsageConsumer role..."
}
```

## 🔍 Causa Raíz (Root Cause)
Las llamadas a la base de datos para la creación de la empresa o usuario de Firebase se ejecutan *del lado del servidor* usando el **Firebase Admin SDK**. Esto depende de la Credencial de Servicios de Google (`firebase-adminsdk-fbsvc@geosearch-fq4i9.iam.gserviceaccount.com`). 

Esta cuenta de servicio **perdió accidentalmente u omitió** el permiso de uso de servicios en la consola de IAM de Google Cloud Platform (GCP). Como Firebase usa la infraestructura de Google, sin este permiso la petición se rechaza por seguridad en el backend y lanza el error a la pantalla (frontend).

## ✅ Pasos para Solucionarlo (Para cuando regresemos)

1. Ingresar directamente a la [Consola de IAM y Administración de Google Cloud](https://console.cloud.google.com/iam-admin/iam?project=geosearch-fq4i9).
2. Asegurarse de estar en el proyecto correcto correspondiente a `geosearch-fq4i9`.
3. En la lista principal ("Principals" / "Principales"), buscar la cuenta de servicio del Firebase Admin SDK: `firebase-adminsdk-fbsvc@...`
4. Hacer clic en el icono del lápiz ✏️ a la derecha para "Editar principal".
5. Pulsar en **+ AGREGAR OTRO ROL** (Add Another Role).
6. Buscar y añadir el rol: **"Consumidor del uso de servicios"** (`Service Usage Consumer`).
7. Aprovechar y corroborar que dicha cuenta de servicio todavía conserve su gran rol original principal de `"Administrador de Firebase"` (`Firebase Admin`).
8. Clic en **Guardar**.
9. Esperar unos 3 a 5 minutos (es lo que tarda Google GCP en propagar los permisos a la nube global) y volver a darle **"Registrarse"** en la web.

> [!NOTE] 
> Si la solución de IAM de arriba no aplica porque los roles ya estaban perfectos, se deberá generar y renovar un nuevo archivo JSON de clave privada en Firebase -> Configuración del proyecto -> Cuentas de Servicio, y sustituir completamente el string que está actualmente en el `.env` o en `.env.local`  como `FIREBASE_SERVICE_ACCOUNT_KEY` y en los secretos de Vercel/Cloud Run.
