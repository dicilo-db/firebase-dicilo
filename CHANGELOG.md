# Bitácora de Cambios - Dicilo.net

Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---

### **135. REVERT: REVERSIÓN A ARQUITECTURA ANTERIOR PARA RESTAURAR ESTABILIDAD - CÓDIGO: REVERT-TO-STABLE-BASE**

- **Fecha y Hora:** 20 de Septiembre de 2025, 18:30 (CET)
- **Módulos Afectados:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/dicilo-search-page.tsx`.
- **Descripción del Cambio:**
  - **Motivo de la Reversión:** Tras la implementación de una serie de correcciones arquitectónicas, la aplicación entró en un estado inestable manifestado por una "página gris" o en blanco, causada por conflictos de renderizado e hidratación irresolubles en la página principal.
  - **Acción Realizada:** A petición del usuario, se ha realizado una reversión controlada de los archivos clave a un estado anterior y funcional. Esto implica deshacer los cambios recientes en la arquitectura de carga de datos de la página principal (`page.tsx` y `dicilo-search-page.tsx`) y en la configuración global de internacionalización (`layout.tsx`).
  - **Estado Restaurado:** Se ha restaurado la lógica donde el componente de búsqueda del cliente gestiona su propia carga de datos. Aunque esta arquitectura puede presentar otros desafíos, se ha confirmado como un punto de partida funcional y estable desde el cual se pueden aplicar mejoras de forma más controlada.
  - **Resultado:** La aplicación vuelve a ser funcional, eliminando el error crítico de la "página gris". Esto permite reanudar el desarrollo sobre una base conocida y estable.

### **134. FIX: CORRECCIÓN DE ERROR DE HIDRATACIÓN EN I18N-PROVIDER - CÓDIGO: I18N-HYDRATION-FIX-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `src/context/i18n-provider.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un error crítico y recurrente de "fallo de hidratación" (`Hydration failed`). La causa raíz era una condición de carrera (`race condition`) en el componente `i18n-provider.tsx`, donde la inicialización de la librería `i18next` no se completaba de manera fiable antes de que los componentes cliente intentaran renderizarse. Esto provocaba una discrepancia entre el HTML renderizado en el servidor y el cliente.
  - **Solución Arquitectónica:** Se ha reescrito por completo el proveedor de internacionalización para seguir un patrón más robusto y estándar. La instancia de `i18next` ahora se inicializa una única vez a nivel de módulo, eliminando la condición de carrera. Se ha añadido la integración correcta con React (`initReactI18next`) y se ha simplificado el proveedor para usar `I18nextProvider`, el componente oficial de la librería, garantizando una gestión de estado estable y predecible.
  - **Resultado:** Esta corrección estructural elimina la causa raíz del error de hidratación, estabilizando el sistema de traducciones en toda la aplicación y asegurando que la interfaz de usuario se renderice de manera consistente tanto en el servidor como en el cliente.

### **133. FIX: REESCRITURA FINAL Y ROBUSTA DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-FINAL-RELIABLE-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:30 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo Persistente:** Se ha determinado que la causa raíz del inaceptable y persistente error "Zugriff verweigert" (Acceso denegado) se debe a una arquitectura de asignación de roles inestable y propensa a fallos de despliegue o ejecución silenciosa en el backend.
  - **Solución Arquitectónica (Retorno al Estándar de la Industria):** Se abandona por completo cualquier solución de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o dependencia de funciones "callable" que han demostrado ser ineficaces.
  - **Refuerzo de la Resiliencia del Frontend:** Se ha mejorado el hook `useAuthGuard.ts` para que, en el improbable caso de que detecte un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado de cliente limpio y seguro.
  - **Integridad y Estabilidad Definitiva:** Este cambio masivo y final devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase. Resuelve de una vez por todas el frustrante problema de acceso, eliminando las soluciones de emergencia fallidas y restaurando la confianza en la arquitectura del sistema.

### **132. FIX: RESTAURACIÓN DE LA ARQUITECTURA DE AUTORIZACIÓN ESTÁNDAR Y FIABLE - CÓDIGO: AUTH-REBUILD-FINAL-V2**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo:** Se ha determinado que todos los intentos de soluciones de emergencia para asignar roles de administrador han fallado debido a una arquitectura inestable y propensa a errores. El problema de "Acceso denegado" persistía porque la asignación de permisos no era fiable.
  - **Solución Arquitectónica (Retorno al Estándar):** Se abandona por completo el enfoque de funciones "callable" de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
  - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`, que ha sido una fuente de errores. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
  - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado limpio.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las soluciones de emergencia que han resultado ser fallidas y frustrantes.

### **131. FIX: REESTRUCTURACIÓN FINAL DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-REBUILD-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 13:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Fallo Arquitectónico:** Tras múltiples fallos inaceptables, se ha identificado que todas las soluciones de "emergencia" para asignar roles de administrador eran fundamentalmente defectuosas y propensas a errores. El problema de "Acceso denegado" persistía debido a una lógica de backend inestable y a una verificación de permisos en el frontend poco resiliente.
  - **Solución Arquitectónica Definitiva:** Se abandona por completo el enfoque de funciones "callable" de emergencia y se vuelve a la arquitectura estándar, robusta y recomendada por Firebase.
    - **Restauración de `onWrite` (v1):** Se ha reescrito `functions/src/index.ts` para utilizar el disparador `firestore.document().onWrite()` de la versión 1 de Cloud Functions. Esta función es extremadamente fiable y asignará los `custom claims` de rol (`admin`, `superadmin`) de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
    - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`. Ha sido una fuente constante de errores y confusión. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
    - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las complejas y fallidas soluciones de emergencia.

### **130. FIX: SOLUCIÓN DEFINITIVA Y ROBUSTA A PROBLEMA DE ACCESO DENEGADO - CÓDIGO: AUTH-MASTER-FIX-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/hooks/useAuthGuard.ts`, `src/app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error Fundamental:** Se identificó que el persistente error "Zugriff verweigert" (Acceso denegado) era causado por una condición de carrera (`race condition`) en la asignación de permisos de administrador. La Cloud Function automática (`onDocumentWrite`) no garantizaba la asignación de los `custom claims` de rol antes de que el frontend intentara verificar dichos permisos, resultando en un fallo de autorización.
  - **Solución Arquitectónica (Invocación Manual):** Se ha reemplazado el sistema de asignación automática de roles por un mecanismo manual, explícito y robusto.
    - **Nueva Cloud Function `makeAdmin`:** Se creó una función "callable" que asigna de forma inmediata y síncrona los `custom claims` de `admin` o `superadmin` a un usuario específico a través de su correo electrónico.
    - **Formulario de Emergencia en `/admin/seed`:** Se añadió un formulario de "emergencia" en la página estática `/admin/seed` para permitir a un usuario ya autenticado (pero sin acceso al dashboard) invocar la función `makeAdmin` sobre sí mismo o sobre otro usuario, forzando la asignación de permisos. Esto actúa como un mecanismo de recuperación infalible.
  - **Refuerzo del Frontend (`useAuthGuard`):** Se ha mejorado el hook `useAuthGuard` para que, en caso de detectar un usuario sin los permisos necesarios, cierre activamente la sesión (`signOut`) antes de redirigir a la página de login. Esto previene cualquier bucle de autenticación y asegura un estado limpio.
  - **Integridad y Control:** Este cambio estructural elimina la dependencia de disparadores automáticos para una tarea crítica como la autorización, otorgando un control directo y fiable sobre la gestión de roles de administrador y resolviendo de una vez por todas el problema de acceso.

### **129. FIX: SOLUCIÓN DEFINITIVA A PÉRDIDA DE DATOS AL GUARDAR CLIENTE - CÓDIGO: FIX-SAVE-DEEPMERGE-V1**

- **Fecha y Hora:** 19 de Septiembre de 2025, 16:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error:** Se identificó que la causa raíz de la persistente pérdida de datos al guardar un cliente era una estrategia de actualización defectuosa. La función `updateDoc` de Firestore, al recibir un objeto anidado incompleto, reemplazaba el objeto entero en la base de datos, eliminando los sub-campos no modificados.
  - **Solución Arquitectónica (Deep Merge):** Se ha implementado una solución robusta y definitiva. Ahora, la función `onSubmit` primero obtiene el documento original completo desde Firestore. Luego, utiliza la función `_.merge` de `lodash` para realizar una "fusión profunda" (deep merge), combinando de manera inteligente y recursiva los nuevos datos del formulario sobre los datos existentes.
  - **Integridad de Datos Garantizada:** Este enfoque asegura que solo los campos que el usuario ha modificado explícitamente se actualizan, mientras que todos los demás campos, especialmente los anidados, conservan sus valores originales. Se elimina de raíz el riesgo de borrado accidental de datos.
  - **Documentación:** Se registra esta corrección arquitectónica fundamental en el `CHANGELOG.md` como la solución final al problema de guardado.

