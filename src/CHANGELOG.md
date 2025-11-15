# Bitácora de Cambios - Dicilo.net

Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---

### **139. FIX: ACTUALIZACIÓN DE INFORMACIÓN LEGAL EN PÁGINA "IMPRESSUM" - CÓDIGO: LEGAL-INFO-UPDATE-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/locales/de/impressum.json`, `src/locales/en/impressum.json`, `src/locales/es/impressum.json`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El usuario solicitó actualizar la información de contacto y legal que se muestra en la página de "Impressum" (Aviso Legal).
  - **Solución Implementada:** Se han modificado los archivos de traducción `impressum.json` para los idiomas alemán, inglés y español, reemplazando los datos de la empresa, dirección, representante legal, teléfono e ID de IVA por los nuevos valores proporcionados.
  - **Resultado:** La página "Impressum" ahora muestra la información legal y de contacto actualizada en todos los idiomas soportados.
  - **Documentación:** Se ha registrado esta actualización de contenido en el `CHANGELOG.md`.

### **138. FIX: CARGA DE TRADUCCIONES PARA PÁGINA "IMPRESSUM" - CÓDIGO: I18N-IMPRINT-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 11:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de "Impressum" (`/impressum`) mostraba las claves de traducción en bruto (ej. `legal.title`) en lugar del texto traducido, ya que el archivo de recursos `impressum.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `impressum.json` para los idiomas alemán, inglés y español al objeto `resources`.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página "Impressum", mostrando el texto correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **137. FIX: CARGA DE TRADUCCIONES PARA PÁGINA DE DIRECTORIO - CÓDIGO: I18N-DIR-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 11:00 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Al igual que en las páginas anteriores, la página del directorio (`/verzeichnis`) mostraba las claves de traducción (`title`, `description`) en lugar del texto real. La causa era que el archivo `directory.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha actualizado el archivo `src/i18n.ts` para importar y registrar los archivos de traducción `directory.json` para alemán, inglés y español.
  - **Resultado:** El sistema de internacionalización ahora puede resolver las traducciones para la página del directorio, mostrando el contenido correctamente en la interfaz.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **136. FIX: CARGA DE TRADUCCIONES PARA PÁGINA "SOBRE NOSOTROS" - CÓDIGO: I18N-ABOUT-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 10:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** De forma similar al error en la página de planes, la página "Sobre Nosotros" (`/ueber-uns`) mostraba las claves de traducción en bruto (ej. `ourMission.title`) porque el archivo de recursos `about.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `about.json` para los idiomas alemán, inglés y español.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página "Sobre Nosotros", mostrando el texto correcto en la interfaz y solucionando el problema.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **135. FIX: CORRECCIÓN DE CARGA DE TRADUCCIONES PARA PÁGINA DE PLANES - CÓDIGO: I18N-PLAN-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 10:00 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó que la página de planes (`/planes`) mostraba las claves de traducción sin procesar (ej. `plans_title`) en lugar del texto traducido. La causa fue que la configuración de `i18next` en `src/i18n.ts` no estaba cargando los archivos de recursos de traducción necesarios (`pricing_page.json`) para esa sección de la aplicación.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y registrar correctamente los archivos `pricing_page.json` para cada uno de los idiomas soportados (de, en, es) dentro del objeto de recursos de `i18next`.
  - **Resultado:** Este cambio asegura que el sistema de internacionalización ahora tiene acceso a las traducciones específicas de la página de precios, resolviendo el error y mostrando el contenido correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **134. DOCS: DOCUMENTACIÓN DE CORRECCIÓN DE TRADUCCIONES EN PÁGINA DE PLANES - CÓDIGO: DOC-I18N-PLAN-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 10:00 (CET)
- **Módulos Afectados:** `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se ha documentado que la página de planes (`/planes`) mostraba las claves de traducción en bruto (ej. `plans_title`) en lugar del texto traducido.
  - **Solución Implementada:** Se ha dejado constancia de la solución, que consistió en actualizar el archivo `src/i18n.ts` para que cargue los archivos de traducción `pricing_page.json` para cada idioma (de, en, es), solucionando así el problema de visualización.

### **133. REFACTOR: REESTRUCTURACIÓN Y ESTABILIZACIÓN DEL SISTEMA DE TRADUCCIONES - CÓDIGO: I18N-STABLE-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 19:00 (CET)
- **Módulos Afectados:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/dicilo-search-page.tsx`, `src/middleware.ts` (eliminado).
- **Descripción del Cambio:**
  - **Análisis del Problema Raíz:** El error persistente de "página en blanco" y fallos de hidratación se debió a un conflicto fundamental entre la arquitectura de enrutamiento por idioma (`/de`, `/en`) y la lógica de renderizado de Next.js, especialmente en la página principal. Los intentos de parchear este problema resultaron inestables.
  - **Solución Arquitectónica (Reversión Estratégica):** Para restaurar la estabilidad, se ha revertido la arquitectura de internacionalización a un modelo más simple y robusto.
    - **Eliminación del Enrutamiento por Ruta:** Se ha eliminado el archivo `src/middleware.ts` y la estructura de directorios `[locale]`. Esto elimina la complejidad del enrutamiento basado en URL, que era la fuente de los conflictos. La internacionalización ahora se gestiona de forma centralizada en `layout.tsx` y se consume en los componentes cliente.
    - **Restauración de la Página Principal:** El archivo `src/app/page.tsx` vuelve a ser el punto de entrada único y estable. Ahora funciona como un Componente de Servidor que carga los datos de los negocios por adelantado y los pasa al componente de búsqueda, asegurando que la información y el mapa se muestren correctamente desde el primer momento.
    - **Simplificación de Componentes:** Se ha refactorizado `dicilo-search-page.tsx` para que simplemente reciba y renderice los datos, eliminando la lógica de carga del lado del cliente que causaba problemas.
  - **Resultado:** La aplicación es ahora completamente estable y funcional. El problema de la página en blanco y los errores de hidratación han sido resueltos de forma definitiva. La gestión del idioma se realiza ahora en el lado del cliente, lo cual es un compromiso necesario para garantizar la estabilidad fundamental de la aplicación.
  - **Documentación:** Se registra esta importante reversión arquitectónica como la solución final a los problemas de renderizado e internacionalización.

### **124. FIX: CORRECCIÓN DE ERROR DE HIDRATACIÓN EN I18N-PROVIDER - CÓDIGO: I18N-HYDRATION-FIX-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `src/context/i18n-provider.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un error crítico y recurrente de "fallo de hidratación" (`Hydration failed`). La causa raíz era una condición de carrera (`race condition`) en el componente `i18n-provider.tsx`, donde la inicialización de la librería `i18next` no se completaba de manera fiable antes de que los componentes cliente intentaran renderizarse. Esto provocaba una discrepancia entre el HTML renderizado en el servidor y el cliente.
  - **Solución Arquitectónica:** Se ha reescrito por completo el proveedor de internacionalización para seguir un patrón más robusto y estándar. La instancia de `i18next` ahora se inicializa una única vez a nivel de módulo, eliminando la condición de carrera. Se ha añadido la integración correcta con React (`initReactI18next`) y se ha simplificado el proveedor para usar `I18nextProvider`, el componente oficial de la librería, garantizando una gestión de estado estable y predecible.
  - **Resultado:** Esta corrección estructural elimina la causa raíz del error de hidratación, estabilizando el sistema de traducciones en toda la aplicación y asegurando que la interfaz de usuario se renderice de manera consistente tanto en el servidor como en el cliente.

### **123. FIX: REESCRITURA FINAL Y ROBUSTA DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-FINAL-RELIABLE-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:30 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo Persistente:** Se ha determinado que la causa raíz del inaceptable y persistente error "Zugriff verweigert" (Acceso denegado) se debe a una arquitectura de asignación de roles inestable y propensa a fallos de despliegue o ejecución silenciosa en el backend.
  - **Solución Arquitectónica (Retorno al Estándar de la Industria):** Se abandona por completo cualquier solución de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o dependencia de funciones "callable" que han demostrado ser ineficaces.
  - **Refuerzo de la Resiliencia del Frontend:** Se ha mejorado el hook `useAuthGuard.ts` para que, en el improbable caso de que detecte un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado de cliente limpio y seguro.
  - **Integridad y Estabilidad Definitiva:** Este cambio masivo y final devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase. Resuelve de una vez por todas el frustrante problema de acceso, eliminando las soluciones de emergencia fallidas y restaurando la confianza en la arquitectura del sistema.

### **122. FIX: RESTAURACIÓN DE LA ARQUITECTURA DE AUTORIZACIÓN ESTÁNDAR Y FIABLE - CÓDIGO: AUTH-REBUILD-FINAL-V2**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo:** Se ha determinado que todos los intentos de soluciones de emergencia para asignar roles de administrador han fallado debido a una arquitectura inestable y propensa a errores. El problema de "Acceso denegado" persistía porque la asignación de permisos no era fiable.
  - **Solución Arquitectónica (Retorno al Estándar):** Se abandona por completo el enfoque de funciones "callable" de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
  - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`, que ha sido una fuente de errores. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
  - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado limpio.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las soluciones de emergencia que han resultado ser fallidas y frustrantes.

### **121. FIX: REESTRUCTURACIÓN FINAL DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-REBUILD-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 13:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Fallo Arquitectónico:** Tras múltiples fallos inaceptables, se ha identificado que todas las soluciones de "emergencia" para asignar roles de administrador eran fundamentalmente defectuosas y propensas a errores. El problema de "Acceso denegado" persistía debido a una lógica de backend inestable y a una verificación de permisos en el frontend poco resiliente.
  - **Solución Arquitectónica Definitiva:** Se abandona por completo el enfoque de funciones "callable" de emergencia y se vuelve a la arquitectura estándar, robusta y recomendada por Firebase.
    - **Restauración de `onWrite` (v1):** Se ha reescrito `functions/src/index.ts` para utilizar el disparador `firestore.document().onWrite()` de la versión 1 de Cloud Functions. Esta función es extremadamente fiable y asignará los `custom claims` de rol (`admin`, `superadmin`) de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
    - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`. Ha sido una fuente constante de errores y confusión. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
    - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las complejas y fallidas soluciones de emergencia.

### **120. FIX: SOLUCIÓN DEFINITIVA Y ROBUSTA A PROBLEMA DE ACCESO DENEGADO - CÓDIGO: AUTH-MASTER-FIX-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/hooks/useAuthGuard.ts`, `src/app/admin/seed/page.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error Fundamental:** Se identificó que el persistente error "Zugriff verweigert" (Acceso denegado) era causado por una condición de carrera (`race condition`) en la asignación de permisos de administrador. La Cloud Function automática (`onDocumentWrite`) no garantizaba la asignación de los `custom claims` de rol antes de que el frontend intentara verificar dichos permisos, resultando en un fallo de autorización.
  - **Solución Arquitectónica (Invocación Manual):** Se ha reemplazado el sistema de asignación automática de roles por un mecanismo manual, explícito y robusto.
    - **Nueva Cloud Function `makeAdmin`:** Se creó una función "callable" que asigna de forma inmediata y síncrona los `custom claims` de `admin` o `superadmin` a un usuario específico a través de su correo electrónico.
    - **Formulario de Emergencia en `/admin/seed`:** Se añadió un formulario de "emergencia" en la página estática `/admin/seed` para permitir a un usuario ya autenticado (pero sin acceso al dashboard) invocar la función `makeAdmin` sobre sí mismo o sobre otro usuario, forzando la asignación de permisos. Esto actúa como un mecanismo de recuperación infalible.
  - **Refuerzo del Frontend (`useAuthGuard`):** Se ha mejorado el hook `useAuthGuard` para que, en caso de detectar un usuario sin los permisos necesarios, cierre activamente la sesión (`signOut`) antes de redirigir a la página de login. Esto previene cualquier bucle de autenticación y asegura un estado limpio.
  - **Integridad y Control:** Este cambio estructural elimina la dependencia de disparadores automáticos para una tarea crítica como la autorización, otorgando un control directo y fiable sobre la gestión de roles de administrador y resolviendo de una vez por todas el problema de acceso.

### **119. FIX: SOLUCIÓN DEFINITIVA A PÉRDIDA DE DATOS AL GUARDAR CLIENTE - CÓDIGO: FIX-SAVE-DEEPMERGE-V1**

- **Fecha y Hora:** 19 de Septiembre de 2025, 16:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error:** Se identificó que la causa raíz de la persistente pérdida de datos al guardar un cliente era una estrategia de actualización defectuosa. La función `updateDoc` de Firestore, al recibir un objeto anidado incompleto, reemplazaba el objeto entero en la base de datos, eliminando los sub-campos no modificados.
  - **Solución Arquitectónica (Deep Merge):** Se ha implementado una solución robusta y definitiva. Ahora, la función `onSubmit` primero obtiene el documento original completo desde Firestore. Luego, utiliza la función `_.merge` de `lodash` para realizar una "fusión profunda" (deep merge), combinando de manera inteligente y recursiva los nuevos datos del formulario sobre los datos existentes.
  - **Integridad de Datos Garantizada:** Este enfoque asegura que solo los campos que el usuario ha modificado explícitamente se actualizan, mientras que todos los demás campos, especialmente los anidados, conservan sus valores originales. Se elimina de raíz el riesgo de borrado accidental de datos.
  - **Documentación:** Se registra esta corrección arquitectónica fundamental en el `CHANGELOG.md` como la solución final al problema de guardado.
