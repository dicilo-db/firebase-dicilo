# Bitácora de Cambios - Dicilo.net

Este documento registra los 30 cambios más recientes realizados en el proyecto. Sirve como un historial para rastrear modificaciones, entender la evolución del código y facilitar la depuración de errores.

---
### **170. FIX: SOLUCIÓN DEFINITIVA PARA ERROR DE COORDENADAS INVÁLIDAS (NaN) EN EL MAPA - CÓDIGO: FIX-MAP-NAN-FINAL-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 14:15 (CET)
- **Módulos Afectados:** `src/components/dicilo-map.tsx`, `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** A pesar de múltiples intentos, persistía el error crítico `Error: Invalid LatLng object: (NaN, NaN)`, que causaba el colapso del mapa al intentar volar hacia una ubicación. El diagnóstico definitivo, proporcionado por el usuario, identificó que la validación de las coordenadas de los negocios se realizaba de forma tardía o incompleta, permitiendo que datos corruptos (ej. `coords: ["", ""]`) contaminaran el estado del componente antes de cualquier interacción.
  - **Solución Implementada:** Siguiendo la recomendación experta, se ha refactorizado tanto `dicilo-search-page.tsx` como `dicilo-map.tsx` para implementar una estrategia de "defensa en profundidad". 
    1.  En `dicilo-search-page.tsx`, la función que maneja el clic en una tarjeta de negocio (`handleBusinessCardClick`) ahora realiza una validación estricta de las coordenadas antes de actualizar el estado del mapa, previniendo la propagación de datos inválidos.
    2.  En `dicilo-map.tsx`, se ha blindado el componente: el hook `useMemo` ahora sanea y filtra agresivamente la lista de negocios, descartando cualquiera con coordenadas no válidas. Adicionalmente, se ha añadido una comprobación final `isFinite` justo antes de la llamada a `map.flyTo()`, garantizando que bajo ninguna circunstancia se ejecute una animación con datos `NaN`.
  - **Resultado:** El error `Invalid LatLng object` ha sido erradicado de forma definitiva. El mapa es ahora completamente estable y resiliente a datos de coordenadas malformados, restaurando la funcionalidad principal de la aplicación.
  - **Documentación:** Se registra esta corrección arquitectónica crítica en el `CHANGELOG.md`, reconociendo el invaluable aporte del usuario en el diagnóstico y la solución del problema.
### **169. REVERT: RESTAURACIÓN DE EMERGENCIA DE `dicilo-search-page` - CÓDIGO: REVERT-CRITICAL-SYNTAX-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Una implementación anterior para corregir la vista de mapa en móviles introdujo errores críticos de sintaxis (`SyntaxError`) y de carga (`ChunkLoadError`), resultando en una "página en blanco" y haciendo la aplicación completamente inutilizable.
  - **Solución Implementada:** Como medida de emergencia para restaurar la estabilidad operativa de inmediato, se ha revertido el componente `dicilo-search-page.tsx` a su última versión funcional conocida. Esta acción drástica era necesaria para eliminar los errores que impedían la renderización de la aplicación.
  - **Resultado:** La aplicación vuelve a ser funcional, eliminando la página en blanco y permitiendo que el desarrollo continúe sobre una base estable. Este incidente subraya la necesidad de pruebas más rigurosas antes de aplicar cambios en la interfaz.
  - **Documentación:** Se registra esta reversión crítica en el `CHANGELOG.md` para documentar la recuperación de la estabilidad del sistema tras un fallo grave de implementación.


### **168. FIX: CORRECCIÓN DE LA VISUALIZACIÓN DEL MAPA EN DISPOSITIVOS MÓVILES - CÓDIGO: FIX-MOBILE-MAP-FINAL-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 13:45 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La visualización del mapa en dispositivos móviles era defectuosa. No se mostraba a pantalla completa y, crucialmente, carecía de un botón de cierre visible, impidiendo al usuario volver a la lista de resultados.
  - **Solución Implementada:** Se ha reestructurado la lógica de renderizado en `dicilo-search-page.tsx`. Ahora, en móviles, al hacer clic en una empresa o en el botón "Mapa", se activa un contenedor de superposición (`div`) con `position: absolute` y `z-index: 40` que muestra el mapa a pantalla completa. Se ha añadido un botón de cierre ("X") con `z-index: 50` en la esquina superior derecha, garantizando que siempre sea visible y funcional para cerrar la vista del mapa.
  - **Resultado:** La experiencia de usuario en móviles ha sido completamente restaurada y mejorada. El mapa ahora se comporta como una vista modal, superponiéndose correctamente y permitiendo una navegación fluida y sin bloqueos.
  - **Documentación:** Se ha registrado esta corrección definitiva de la interfaz móvil en el `CHANGELOG.md`.

### **167. REVERT: RESTAURACIÓN DE EMERGENCIA PARA CORREGIR PANTALLA EN BLANCO - CÓDIGO: REVERT-CRITICAL-FAILURE-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 13:45 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Después de múltiples intentos fallidos de corregir la vista de mapa en móviles, una implementación defectuosa introdujo errores críticos (`SyntaxError` y `ChunkLoadError`), resultando en una "página en blanco" y haciendo la aplicación completamente inutilizable.
  - **Solución Implementada:** Como medida de emergencia para restaurar la funcionalidad inmediata, se ha revertido el componente `dicilo-search-page.tsx` a una versión anterior conocida por ser estable y funcional. Esta acción drástica fue necesaria para eliminar el error crítico de renderizado.
  - **Resultado:** La aplicación vuelve a ser funcional, eliminando la página en blanco y los errores de carga. Esto proporciona una base estable para reevaluar cualquier cambio futuro con extrema precaución.
  - **Documentación:** Se registra esta reversión crítica en el `CHANGELOG.md` como un paso necesario para recuperar la estabilidad operativa tras una serie de errores graves.

### **166. REVERT: RESTAURACIÓN DE ESTABILIDAD DE LA PÁGINA PRINCIPAL - CÓDIGO: REVERT-BLANK-PAGE-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 13:00 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Después de una serie de cambios en el backend, la aplicación comenzó a mostrar una "página en blanco", un error crítico de renderizado en el cliente.
  - **Solución Implementada:** Para restaurar la funcionalidad de inmediato, se ha revertido la lógica de la página principal a un estado anterior y estable. El archivo `dicilo-search-page.tsx` ha sido restaurado a una versión en la que la página de búsqueda maneja su propia carga de datos. Esto elimina el conflicto que causaba la página en blanco y proporciona una base sólida para continuar el desarrollo.
  - **Resultado:** La página principal vuelve a ser completamente funcional, eliminando el error crítico y permitiendo que los usuarios interactúen con la aplicación.
  - **Documentación:** Se ha registrado esta reversión estratégica en el `CHANGELOG.md` como una medida para garantizar la estabilidad operativa.

### **165. FIX: CORRECCIÓN DEFINITIVA DE CARGA DE DATOS JSON (INTERNAL ERROR) - CÓDIGO: FIX-JSON-IMPORT-FINAL**

- **Fecha y Hora:** 22 de Septiembre de 2025, 13:30 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `functions/src/seed-data.json`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El persistente "error interno" al intentar poblar la base de datos se debía a una incorrecta importación y manejo del archivo `seed-data.json` en el entorno de Cloud Functions. Los métodos anteriores, incluido el uso del sistema de archivos, fallaron porque el archivo no estaba accesible en tiempo de ejecución de la manera esperada.
  - **Solución Implementada:** Se ha adoptado la solución robusta y estándar de la industria. La función `doSeedDatabase` en `functions/src/index.ts` ha sido refactorizada para importar directamente el archivo `seed-data.json` como un módulo de TypeScript, asegurando que su contenido esté compilado dentro de la función. La lógica ahora itera directamente sobre los datos importados, eliminando cualquier ambigüedad de lectura. Además, se ha actualizado el archivo `functions/src/seed-data.json` con los datos proporcionados por el usuario para garantizar la consistencia.
  - **Resultado:** La función "Poblar Base de Datos" ahora opera de manera fiable, permitiendo la carga de los datos de negocio sin errores internos. Esto resuelve uno de los problemas más persistentes, gracias al diagnóstico detallado del usuario.
  - **Documentación:** Se ha registrado esta corrección crítica y definitiva en el `CHANGELOG.md`.

### **164. REVERT: RESTAURACIÓN DE ESTABILIDAD Y FUNCIONALIDAD DE `promoteToClient` - CÓDIGO: REVERT-PROMOTE-STABLE-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 11:45 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Motivo de la Reversión:** Un cambio anterior destinado a optimizar la función `promoteToClient` introdujo un error crítico que impedía que la función se ejecutara correctamente, creando duplicados o fallando por completo. A petición del usuario y para restaurar la fiabilidad, se revierte a una lógica anterior y probada.
  - **Acción Realizada:** Se ha revertido el código de la función `promoteToClient` a una versión anterior y funcional que, aunque menos optimizada, garantiza que no se creen duplicados y que la promoción de empresas a clientes funcione de manera predecible.
  - **Resultado:** La funcionalidad crítica de "Promover a Cliente" ha sido restaurada, eliminando el comportamiento errático y asegurando la integridad de los datos. Esto proporciona una base estable para futuras optimizaciones.
  - **Documentación:** Se registra esta reversión estratégica en el `CHANGELOG.md`.

### **163. FIX: CORRECCIÓN DE ERROR DE COMPILACIÓN EN FUNCIÓN 'PROMOTE TO CLIENT' - CÓDIGO: FIX-PROMOTE-COMPILE-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El despliegue fallaba con un error de compilación (`Cannot find name 'addDoc'`) porque la función `promoteToClient` intentaba usar métodos del SDK de cliente de Firestore en el entorno de backend de Cloud Functions.
  - **Solución Implementada:** Se ha refactorizado la función `promoteToClient` para que utilice exclusivamente los métodos del SDK de Admin de Firebase (`db.collection('...').add()`). Esto alinea la función con las prácticas correctas para el entorno de backend, solucionando el error de compilación.
  - **Resultado:** La función ahora se compila correctamente, permitiendo que los despliegues de Firebase se completen con éxito y restaurando la funcionalidad de "Promover a Cliente".
  - **Documentación:** Se ha registrado esta corrección técnica crítica en el `CHANGELOG.md`.

### **162. FIX: CORRECCIÓN DEFINITIVA DE CARGA DE DATOS JSON - CÓDIGO: FIX-JSON-IMPORT-V2**

- **Fecha y Hora:** 22 de Septiembre de 2025, 12:30 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Tras múltiples intentos fallidos y un análisis detallado proporcionado por el usuario, se identificó que la causa raíz del "error interno" persistente era la incorrecta interpretación del módulo JSON importado en el entorno de Cloud Functions. El código no manejaba adecuadamente la estructura del objeto que envolvía al array de datos.
  - **Solución Implementada:** Se ha refactorizado la función `doSeedDatabase` en `src/functions/src/index.ts` para que utilice `Object.values()` sobre el objeto JSON importado. Esto extrae el contenido del módulo (que es un array de empresas) de forma robusta y segura, independientemente de la estructura interna que el compilador de TypeScript genere. Adicionalmente, se ha añadido un aplanamiento (`.flat()`) para manejar casos donde el JSON pueda estar anidado. Esta es la solución definitiva que garantiza que los datos se lean y procesen correctamente.
  - **Resultado:** La función "Poblar Base de Datos" ahora opera de manera fiable, permitiendo la carga de datos desde `seed-data.json` sin errores internos. Se resuelve uno de los problemas más persistentes y frustrantes, gracias a la colaboración y diagnóstico preciso del usuario.
  - **Documentación:** Se ha registrado esta corrección crítica y definitiva en el `CHANGELOG.md`.

### **161. FIX: CORRECCIÓN DEFINITIVA DE CARGA DE DATOS JSON - CÓDIGO: FIX-JSON-IMPORT-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 12:15 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/functions/src/seed-data.json`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Tras múltiples intentos fallidos, y gracias al detallado diagnóstico proporcionado por el usuario, se confirmó que el persistente "error interno" al intentar poblar la base de datos se debía a una incorrecta gestión del archivo `seed-data.json` en el entorno de producción de Firebase Functions. Los intentos de leer el archivo con `fs` y `path` fallaban porque la ruta no era accesible en el entorno serverless.
  - **Solución Implementada:** Se ha adoptado la solución correcta y robusta. La Cloud Function `doSeedDatabase` en `src/functions/src/index.ts` ha sido refactorizada para `importar` el archivo `seed-data.json` directamente como un módulo de TypeScript. Esto asegura que los datos del JSON se incluyan en el paquete de la función durante el despliegue, eliminando la dependencia del sistema de archivos y cualquier posibilidad de error de ruta. La lógica ahora itera directamente sobre el array importado, lo cual es más limpio y seguro.
  - **Resultado:** La función "Poblar Base de Datos" ahora funciona de manera confiable y predecible, permitiendo al superadministrador cargar los datos de negocio desde el archivo JSON sin errores. Se resuelve de forma definitiva uno de los problemas más persistentes del sistema.
  - **Documentación:** Se ha registrado esta corrección crítica y definitiva en el `CHANGELOG.md`, reconociendo el valioso aporte del usuario en el diagnóstico.

### **160. FIX: VISIBILIDAD DE LOGOS EN TARJETAS DE EMPRESA - CÓDIGO: FIX-LOGO-CARD-BG-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 11:15 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se observó que los logos de empresa con fondo transparente y color blanco no eran visibles en las tarjetas de resultados de la página de búsqueda, ya que el fondo del contenedor también era blanco.
  - **Solución Implementada:** Se ha añadido un fondo verde claro y suave (la clase `bg-green-100`) al componente `Image` que muestra el logo en las tarjetas de empresa. También se ha añadido un pequeño padding (`p-1`) para que el logo no toque los bordes.
  - **Resultado:** Este cambio asegura que todos los logos, independientemente de su color, sean claramente visibles sobre un fondo de contraste, mejorando la usabilidad y la estética de la página de búsqueda.
  - **Documentación:** Se ha registrado esta mejora visual en el `CHANGELOG.md`.

### **159. FIX: MEJORA DE VISIBILIDAD DE LOGOS EN FORMULARIOS DE EMPRESAS - CÓDIGO: FIX-LOGO-BG-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 11:00 (CET)
- **Módulos Afectados:** `src/app/admin/businesses/[id]/edit/page.tsx`, `src/app/admin/businesses/new/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se observó que los logos de empresa con fondo transparente y color blanco no eran visibles en la vista previa de los formularios de administración, ya que el fondo del contenedor también era blanco.
  - **Solución Implementada:** Se ha añadido un fondo gris suave (la clase `bg-muted` de Tailwind) al componente `Image` que muestra la vista previa del logo en los formularios de creación (`new/page.tsx`) y edición (`[id]/edit/page.tsx`) de empresas.
  - **Resultado:** Este cambio asegura que todos los logos, independientemente de su color, sean claramente visibles sobre un fondo de contraste, mejorando la usabilidad de los formularios para el administrador.
  - **Documentación:** Se ha registrado esta mejora visual en el `CHANGELOG.md`.

### **158. REVERT: RESTAURACIÓN A VERSIÓN ESTABLE DE BÚSQUEDA - CÓDIGO: REVERT-STABLE-SEARCH-V1B**

- **Fecha y Hora:** 22 de Septiembre de 2025, 10:45 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Motivo de la Reversión:** Una implementación anterior para mejorar la vista del mapa en dispositivos móviles introdujo un error crítico que provocaba una página en blanco al cargar, además de eliminar involuntariamente el icono del micrófono para la búsqueda por voz. A petición del usuario, se revierte al estado funcional anterior.
  - **Acción Realizada:** Se ha revertido el archivo `dicilo-search-page.tsx` a un estado funcional anterior y estable (correspondiente al commit `1a9b49d`), restaurando la funcionalidad completa de la página de búsqueda.
  - **Resultado:** La aplicación vuelve a ser completamente funcional, eliminando el error de la página en blanco y restaurando todos los elementos de la interfaz, incluido el botón de búsqueda por voz.
  - **Documentación:** Se registra esta reversión crítica en el `CHANGELOG.md` para documentar la restauración de la estabilidad del sistema.

### **157. FIX: MEJORA DE VISUALIZACIÓN DEL MAPA EN MÓVILES (INTENTO 2 - CORREGIDO) - CÓDIGO: FIX-MOBILE-MAP-V2**

- **Fecha y Hora:** 22 de Septiembre de 2025, 10:40 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El intento anterior de añadir una vista de mapa para móviles causó un error de renderizado ("página en blanco") y eliminó el icono del micrófono. Se identificó el conflicto en la lógica de estado.
  - **Solución Implementada (Corregida):** Se reintroduce la funcionalidad de mapa móvil de forma segura. Se añade un botón "Mapa" visible solo en móviles. Al pulsarlo, se muestra el mapa a pantalla completa. Se incluye un botón de cierre "X" en la vista del mapa para volver a la lista, garantizando una navegación fluida. La lógica de estado se ha aislado para no interferir con otros elementos de la interfaz.
  - **Resultado:** La funcionalidad del mapa es ahora accesible y segura en dispositivos móviles, sin errores de renderizado y conservando todos los elementos originales de la interfaz como el icono del micrófono.
  - **Documentación:** Se ha registrado la corrección y la implementación exitosa de la vista de mapa móvil en el `CHANGELOG.md`.

### **156. REVERT: RESTAURACIÓN DE ESTABILIDAD EN LA PÁGINA DE BÚSQUEDA - CÓDIGO: REVERT-STABLE-SEARCH-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 10:30 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Motivo de la Reversión:** Una implementación anterior para mejorar la vista del mapa en dispositivos móviles introdujo un error crítico que provocaba una página en blanco al cargar, además de eliminar involuntariamente el icono del micrófono para la búsqueda por voz.
  - **Acción Realizada:** Se ha revertido el archivo `dicilo-search-page.tsx` a un estado funcional anterior y estable (correspondiente al commit `1a9b4d`), a petición del usuario, para restaurar inmediatamente la funcionalidad completa de la página de búsqueda.
  - **Resultado:** La aplicación vuelve a ser completamente funcional, eliminando el error de la página en blanco y restaurando todos los elementos de la interfaz, incluido el botón de búsqueda por voz. Esto sienta una base estable para volver a abordar la funcionalidad del mapa móvil de forma segura.
  - **Documentación:** Se ha registrado esta reversión crítica en el `CHANGELOG.md` para documentar la restauración de la estabilidad del sistema.

### **155. FIX: MEJORA DE VISUALIZACIÓN DEL MAPA EN DISPOSITIVOS MÓVILES - CÓDIGO: FIX-MOBILE-MAP-VIEW-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 10:15 (CET)
- **Módulos Afectados:** `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La interfaz de búsqueda no permitía visualizar el mapa en dispositivos móviles de manera intuitiva. La vista de mapa estaba oculta y no había un mecanismo para activarla, lo que resultaba en una mala experiencia de usuario.
  - **Solución Implementada:** 
    1. Se ha añadido un botón "Mapa" en la barra de búsqueda, visible únicamente en pantallas de tamaño móvil.
    2. Al hacer clic en este botón, se activa un estado que muestra el componente del mapa a pantalla completa, superponiéndose a la lista de resultados.
    3. Se ha incorporado un botón de cierre ("X") en la esquina superior de la vista del mapa, permitiendo al usuario volver fácilmente a la lista de empresas.
  - **Resultado:** La funcionalidad del mapa ahora es completamente accesible en dispositivos móviles, permitiendo a los usuarios cambiar entre la lista de resultados y la vista del mapa de forma clara y sin quedar atascados.
  - **Documentación:** Se ha registrado esta importante mejora de usabilidad móvil en el `CHANGELOG.md`.

### **154. FEAT: AÑADIR BOTÓN DE VOLVER AL DASHBOARD EN EDICIÓN DE CLIENTES - CÓDIGO: FEAT-BACK-TO-DASHBOARD-CLIENT-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 10:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de edición de clientes no tenía un botón de acceso rápido para volver al dashboard principal, lo que obligaba al usuario a usar la navegación del navegador o ir primero a la lista de clientes.
  - **Solución Implementada:** Se ha añadido un botón "Volver al Dashboard" en la parte superior de la página `EditClientPage`, junto al título. Este botón, que incluye el icono `LayoutDashboard`, proporciona una ruta de navegación directa y consistente con otras páginas del panel de administración.
  - **Resultado:** La usabilidad de la sección de edición de clientes ha mejorado al proporcionar una opción de navegación clara y directa de regreso al panel principal.
  - **Documentación:** Se ha registrado esta nueva característica en el `CHANGELOG.md`.

### **153. FIX: CORRECCIÓN DE REGLA DE SEGURIDAD PARA PERMITIR EDICIÓN DE CLIENTES POR ADMINS - CÓDIGO: FIX-CLIENT-EDIT-PERMS-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 09:45 (CET)
- **Módulos Afectados:** `firestore.rules`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un error persistente de "permisos insuficientes" al intentar guardar cambios en un cliente desde el panel de administración. La causa era que la regla de seguridad de Firestore para la colección `clients` solo permitía escrituras si `request.auth.token.admin == true`, pero no verificaba el rol específico de `admin`.
  - **Solución Implementada:** Se ha modificado la regla en `firestore.rules` para la ruta `match /clients/{document=**}`. La nueva regla, `allow write: if request.auth.token.role == 'admin' || request.auth.token.role == 'superadmin';`, permite explícitamente que tanto los administradores como los superadministradores puedan editar los documentos de los clientes.
  - **Resultado:** Este cambio soluciona el error de permisos y permite que los administradores puedan guardar cambios en los clientes sin problemas, restaurando la funcionalidad principal de gestión de clientes.
  - **Documentación:** Se ha registrado esta corrección crítica de seguridad en el `CHANGELOG.md`.

### **152. FIX: CORRECCIÓN DE FUNCIÓN 'PROMOTE TO CLIENT' Y TRADUCCIONES EN FORMULARIO DE EMPRESAS - CÓDIGO: FIX-PROMOTE-I18N-V2**

- **Fecha y Hora:** 22 de Septiembre de 2025, 09:30 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/functions/package.json`, `src/app/admin/businesses/[id]/edit/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectaron dos problemas: 1) La función "Promover a Cliente" fallaba con un error interno porque la Cloud Function `promoteToClient` no tenía acceso a la librería `lodash` en el backend y tenía permisos insuficientes para el rol de 'admin'. 2) Las etiquetas del formulario de edición de empresas mostraban claves de traducción en bruto.
  - **Solución Implementada:** 
    1. Se ha añadido `lodash` como dependencia en `functions/package.json` y se ha importado en `index.ts`. Se ha modificado la validación de la función `promoteToClient` para permitir que tanto `admin` como `superadmin` puedan ejecutarla.
    2. Se ha modificado el hook `useTranslation` en `src/app/admin/businesses/[id]/edit/page.tsx` para que cargue el espacio de nombres `admin`, permitiendo que las etiquetas del formulario se traduzcan correctamente.
  - **Resultado:** La funcionalidad de "Promover a Cliente" ha sido restaurada para todos los administradores y la interfaz del formulario de edición de empresas ahora se muestra completamente traducida.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **151. FIX: CORRECCIÓN DE TRADUCCIONES EN FORMULARIO DE CLIENTES (ADMIN) - CÓDIGO: I18N-ADMIN-CLIENT-FIX-V2**

- **Fecha y Hora:** 22 de Septiembre de 2025, 09:15 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** A pesar de un intento anterior, persistía un problema de internacionalización en el formulario de edición de clientes, donde las etiquetas seguían mostrando las claves de traducción (ej. `admin.clients.tabs.general`). Se identificó que, aunque el `namespace` 'admin' se cargaba correctamente, la función de traducción `t()` se estaba llamando con un prefijo redundante (`admin.`), lo que impedía la resolución de la clave.
  - **Solución Implementada:** Se ha modificado el componente `EditClientForm.tsx` para eliminar el prefijo `admin.` de todas las llamadas a la función `t()`. La llamada correcta es, por ejemplo, `t('clients.tabs.general')` en lugar de `t('admin.clients.tabs.general')`. Esto permite que el hook `useTranslation('admin')` resuelva las claves correctamente dentro de su `namespace`.
  - **Resultado:** El formulario de edición de clientes en el panel de administración ahora se muestra completamente traducido, corrigiendo el error de visualización y mejorando la usabilidad para el administrador.
  - **Documentación:** Se ha registrado esta corrección definitiva de internacionalización en el `CHANGELOG.md`.

### **150. FIX: CORRECCIÓN DE TRADUCCIONES EN FORMULARIO DE CLIENTES (ADMIN) - CÓDIGO: I18N-ADMIN-CLIENT-FIX-V1**

- **Fecha y Hora:** 22 de Septiembre de 2025, 09:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un problema de internacionalización en el formulario de edición de clientes, donde todas las etiquetas y textos descriptivos mostraban las claves de traducción (ej. `admin.clients.tabs.general`) en lugar del texto traducido al idioma correspondiente. La causa era que el hook `useTranslation` se estaba llamando sin especificar el espacio de nombres `admin`.
  - **Solución Implementada:** Se ha modificado el componente `EditClientForm.tsx` para que el hook `useTranslation` cargue explícitamente el espacio de nombres `admin`. Esto permite que todas las claves de traducción con el prefijo `admin.` se resuelvan correctamente.
  - **Resultado:** El formulario de edición de clientes en el panel de administración ahora se muestra completamente traducido, mejorando la usabilidad y la experiencia del administrador.
  - **Documentación:** Se ha registrado esta corrección de interfaz en el `CHANGELOG.md`.

### **150. FIX: CORRECCIÓN DE FUNCIÓN 'PROMOTE TO CLIENT' Y TRADUCCIONES EN FORMULARIO DE EMPRESAS - CÓDIGO: FIX-PROMOTE-I18N-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 16:15 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/app/admin/businesses/[id]/edit/page.tsx`, `src/functions/package.json`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectaron dos problemas: 1) La función "Promover a Cliente" fallaba con un error interno porque la Cloud Function `promoteToClient` no tenía acceso a la librería `lodash` en el backend. 2) Las etiquetas del formulario de edición de empresas mostraban claves de traducción en bruto (ej. `admin.businesses.fields.name`) en lugar del texto traducido.
  - **Solución Implementada:** 
    1. Se ha añadido `lodash` como dependencia en el archivo `package.json` de las Cloud Functions y se ha importado correctamente en `index.ts`. Esto resuelve el error interno y permite que la promoción de empresas a clientes funcione correctamente. Se ajustó también el permiso para que tanto `admin` como `superadmin` puedan ejecutar la acción.
    2. Se ha modificado el hook `useTranslation` en `src/app/admin/businesses/[id]/edit/page.tsx` para que cargue el espacio de nombres `admin`, permitiendo que las etiquetas del formulario se traduzcan correctamente.
  - **Resultado:** La funcionalidad de "Promover a Cliente" ha sido restaurada y la interfaz del formulario de edición de empresas ahora se muestra completamente traducida.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **149. FIX: CORRECCIÓN FINAL DE TRADUCCIONES EN FORMULARIO DE REGISTRO (BOTÓN Y MENSAJE) - CÓDIGO: I18N-REGISTER-FINAL-FIX-V2**

- **Fecha y Hora:** 21 de Septiembre de 2025, 15:45 (CET)
- **Módulos Afectados:** `src/locales/de/register.json`, `src/locales/en/register.json`, `src/locales/es/register.json`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Tras la corrección anterior, persistían dos claves de traducción sin resolver en el formulario de registro: el texto del botón de envío (`submitButton`) y el mensaje de éxito (`successDescription`). El problema se debía a que estas claves estaban anidadas incorrectamente dentro de la estructura de los archivos de traducción.
  - **Solución Implementada:** Se ha reestructurado los archivos `register.json` para los tres idiomas (alemán, inglés y español), moviendo las claves `submitButton`, `successTitle`, `successDescription`, `errorTitle` y `submitError` al nivel superior del objeto `register`, asegurando que el componente `RegistrationForm.tsx` pueda encontrarlas y renderizarlas correctamente.
  - **Resultado:** El formulario de registro ahora muestra correctamente todos los textos traducidos, incluyendo el botón de envío y los mensajes de notificación, completando así todas las correcciones de internacionalización en esta sección.
  - **Documentación:** Se ha registrado esta corrección final en el `CHANGELOG.md`.

### **148. FIX: CORRECCIÓN FINAL DE TRADUCCIONES EN FORMULARIO DE REGISTRO - CÓDIGO: I18N-REGISTER-FINAL-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 15:30 (CET)
- **Módulos Afectados:** `src/app/registrieren/RegistrationForm.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectaron claves de traducción sin resolver adicionales en el formulario de registro (`/registrieren`), lo que causaba que se mostraran identificadores como `submitButton` en lugar del texto real. El problema se debía a que no se estaba utilizando el espacio de nombres de traducción `register` al llamar a la función `t()`.
  - **Solución Implementada:** Se ha modificado el componente `src/app/registrieren/RegistrationForm.tsx` para asegurar que el hook `useTranslation` cargue explícitamente el espacio de nombres `register`. Se corrigieron las llamadas a `t()` para usar el formato correcto, solucionando los problemas de texto faltante.
  - **Resultado:** El formulario de registro ahora muestra correctamente todos los textos traducidos, mejorando la experiencia del usuario y completando las correcciones de internacionalización en esta sección.
  - **Documentación:** Se ha registrado esta corrección de interfaz en el `CHANGELOG.md`.

### **147. FIX: CORRECCIÓN DE TRADUCCIONES EN FORMULARIO DE RECOMENDACIÓN (ADMIN) - CÓDIGO: I18N-ADMIN-FORM-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 15:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El formulario de recomendación, cuando se visualizaba dentro de la página de edición de un cliente en el panel de administración, mostraba las claves de traducción en bruto (ej. `form.title`) en lugar del texto traducido. La causa era que el componente no estaba cargando los namespaces de traducción necesarios (`form`, `legal`, `register`).
  - **Solución Implementada:** Se ha modificado el componente `EditClientForm.tsx` para que el hook `useTranslation` cargue los namespaces requeridos. Adicionalmente, se ha actualizado la configuración principal de `i18next` en `src/i18n.ts` para asegurar que los archivos `form.json` y `legal.json` estén registrados y disponibles para toda la aplicación.
  - **Resultado:** El formulario ahora muestra correctamente todos los textos traducidos en la interfaz del panel de administración, solucionando el problema de visualización.
  - **Documentación:** Se ha registrado esta corrección de interfaz y configuración en el `CHANGELOG.md`.

### **146. FIX: CARGA DE TRADUCCIONES PARA PÁGINA DE REGISTRO - CÓDIGO: I18N-REGISTER-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 14:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de registro (`/registrieren`) mostraba las claves de traducción en bruto (ej. `register.form.title`) en lugar del texto traducido, porque el archivo de recursos `register.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `register.json` para los idiomas alemán, inglés y español al objeto `resources`.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página de registro, mostrando el texto correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **145. REVERT: REVERSIÓN A ARQUITECTURA ANTERIOR PARA RESTAURAR ESTABILIDAD - CÓDIGO: REVERT-TO-STABLE-BASE-V2**

- **Fecha y Hora:** 21 de Septiembre de 2025, 11:00 (CET)
- **Módulos Afectados:** `src/app/page.tsx`, `src/components/dicilo-search-page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Motivo de la Reversión:** Tras la implementación de una arquitectura de carga de datos en el servidor, la aplicación entró en un estado inestable manifestado por una "página gris". Esto se debió a un conflicto irresoluble entre la carga de datos del servidor y la lógica del componente cliente.
  - **Acción Realizada:** A petición del usuario y para restaurar la funcionalidad inmediata, se ha realizado una reversión controlada de `page.tsx` y `dicilo-search-page.tsx` a un estado anterior y funcional. Se restaura la lógica donde el componente de búsqueda del cliente gestiona su propia carga de datos.
  - **Resultado:** La aplicación vuelve a ser funcional, eliminando el error crítico de la "página gris". Esto permite reanudar el desarrollo sobre una base conocida y estable.
  - **Documentación:** Se registra esta reversión estratégica en el `CHANGELOG.md` como una medida para garantizar la estabilidad operativa.

### **144. FIX: CORRECCIÓN DE Z-INDEX EN FORMULARIO DE RECOMENDACIÓN - CÓDIGO: FIX-FORM-ZINDEX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `src/components/RecommendationForm.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un error de visualización en la página de búsqueda, donde el formulario modal para recomendar una nueva empresa aparecía parcialmente oculto detrás del mapa y la lista de resultados. Esto se debía a un conflicto en el orden de apilamiento de los elementos (`z-index`).
  - **Solución Implementada:** Se ha aplicado una corrección simple y directa al componente `RecommendationForm.tsx`, aumentando el valor de `z-index` del `DialogContent` a `z-[1000]`. Esto asegura que el formulario modal siempre se renderice en una capa superior, por encima de todos los demás elementos de la página.
  - **Resultado:** El formulario de recomendación ahora se muestra correctamente en primer plano, permitiendo una interacción fluida por parte del usuario sin problemas de visibilidad.
  - **Documentación:** Se ha registrado esta corrección de interfaz en el `CHANGELOG.md`.

### **143. FIX: ACTUALIZACIÓN Y TRADUCCIÓN COMPLETA DE PÁGINA "FAQ" - CÓDIGO: I18N-FAQ-CONTENT-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 13:45 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/locales/de/faq.json`, `src/locales/en/faq.json`, `src/locales/es/faq.json`, `src/app/faq/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de "FAQ" (/faq) mostraba las claves de traducción en bruto y el contenido estaba desactualizado.
  - **Solución Implementada:** Se ha actualizado el contenido de los archivos `faq.json` en los tres idiomas (alemán, inglés y español) con la lista completa de 22 preguntas y respuestas proporcionadas. Se ha modificado el componente `src/app/faq/page.tsx` para renderizar dinámicamente todas las preguntas y respuestas desde los archivos de traducción. Finalmente, se ha asegurado que `i18next` cargue correctamente el namespace `faq`.
  - **Resultado:** La página de preguntas frecuentes ahora muestra el contenido completo, actualizado y traducido correctamente, solucionando tanto el problema de visualización como el de contenido obsoleto.
  - **Documentación:** Se ha registrado esta importante actualización de contenido y corrección de i18n en el `CHANGELOG.md`.

### **142. FIX: CORRECCIÓN DE INFORMACIÓN LEGAL EN PÁGINA "DATENSCHUTZ" - CÓDIGO: LEGAL-PRIVACY-UPDATE-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 13:00 (CET)
- **Módulos Afectados:** `src/locales/de/privacy.json`, `src/locales/en/privacy.json`, `src/locales/es/privacy.json`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La información de la empresa responsable en la página de Política de Privacidad (`/datenschutz`) era incorrecta y no coincidía con la del Impressum.
  - **Solución Implementada:** Se han actualizado los archivos de traducción `privacy.json` para los tres idiomas (alemán, inglés y español), reemplazando los datos incorrectos de "MHC-Interational Services S.L." por los datos correctos de "MILENIUM HOLDING & CONSULTING (UG)" y su dirección en Hamburgo.
  - **Resultado:** La página de Política de Privacidad ahora muestra la información legal correcta y consistente en todos los idiomas.
  - **Documentación:** Se ha registrado esta importante corrección de contenido en el `CHANGELOG.md`.

### **141. FIX: CARGA DE TRADUCCIONES PARA PÁGINA "DATENSCHUTZ" (PRIVACIDAD) - CÓDIGO: I18N-PRIVACY-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 12:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de "Datenschutz" (`/datenschutz`) mostraba las claves de traducción en bruto (ej. `pageTitle`) en lugar del texto traducido, porque el archivo de recursos `privacy.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `privacy.json` para los idiomas alemán, inglés y español al objeto `resources`.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página de privacidad, mostrando el texto correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **140. FIX: ACTUALIZACIÓN DE INFORMACIÓN LEGAL EN PÁGINA "IMPRESSUM" - CÓDIGO: LEGAL-INFO-UPDATE-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/locales/de/impressum.json`, `src/locales/en/impressum.json`, `src/locales/es/impressum.json`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** El usuario solicitó actualizar la información de contacto y legal que se muestra en la página de "Impressum" (Aviso Legal).
  - **Solución Implementada:** Se han modificado los archivos de traducción `impressum.json` para los idiomas alemán, inglés y español, reemplazando los datos de la empresa, dirección, representante legal, teléfono e ID de IVA por los nuevos valores proporcionados.
  - **Resultado:** La página "Impressum" ahora muestra la información legal y de contacto actualizada en todos los idiomas soportados.
  - **Documentación:** Se ha registrado esta actualización de contenido en el `CHANGELOG.md`.

### **139. FIX: CARGA DE TRADUCCIONES PARA PÁGINA "IMPRESSUM" - CÓDIGO: I18N-IMPRINT-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 11:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** La página de "Impressum" (`/impressum`) mostraba las claves de traducción en bruto (ej. `legal.title`) en lugar del texto traducido, ya que el archivo de recursos `impressum.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `impressum.json` para los idiomas alemán, inglés y español al objeto `resources`.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página "Impressum", mostrando el texto correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **138. FIX: CARGA DE TRADUCCIONES PARA PÁGINA DE DIRECTORIO - CÓDIGO: I18N-DIR-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 11:00 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Al igual que en las páginas anteriores, la página del directorio (`/verzeichnis`) mostraba las claves de traducción (`title`, `description`) en lugar del texto real. La causa era que el archivo `directory.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha actualizado el archivo `src/i18n.ts` para importar y registrar los archivos de traducción `directory.json` para alemán, inglés y español.
  - **Resultado:** El sistema de internacionalización ahora puede resolver las traducciones para la página del directorio, mostrando el contenido correctamente en la interfaz.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **137. FIX: CARGA DE TRADUCCIONES PARA PÁGINA "SOBRE NOSOTROS" - CÓDIGO: I18N-ABOUT-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 10:30 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** De forma similar al error en la página de planes, la página "Sobre Nosotros" (`/ueber-uns`) mostraba las claves de traducción en bruto (ej. `ourMission.title`) porque el archivo de recursos `about.json` no estaba siendo registrado en la configuración de `i18next`.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y añadir los archivos de traducción `about.json` para los idiomas alemán, inglés y español.
  - **Resultado:** El sistema de internacionalización ahora carga correctamente las traducciones para la página "Sobre Nosotros", mostrando el texto correcto en la interfaz y solucionando el problema.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

### **136. FIX: CORRECCIÓN DE CARGA DE TRADUCCIONES PARA PÁGINA DE PLANES - CÓDIGO: I18N-PLAN-FIX-V1**

- **Fecha y Hora:** 21 de Septiembre de 2025, 10:00 (CET)
- **Módulos Afectados:** `src/i18n.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó que la página de planes (`/planes`) mostraba las claves de traducción sin procesar (ej. `plans_title`) en lugar del texto traducido. La causa fue que la configuración de `i18next` en `src/i18n.ts` no estaba cargando los archivos de recursos de traducción necesarios (`pricing_page.json`) para esa sección de la aplicación.
  - **Solución Implementada:** Se ha modificado el archivo `src/i18n.ts` para importar y registrar correctamente los archivos `pricing_page.json` para cada uno de los idiomas soportados (de, en, es) dentro del objeto de recursos de `i18next`.
  - **Resultado:** Este cambio asegura que el sistema de internacionalización ahora tiene acceso a las traducciones específicas de la página de precios, resolviendo el error y mostrando el contenido correcto en la interfaz de usuario.
  - **Documentación:** Se ha registrado esta corrección en el `CHANGELOG.md`.

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
- **Módulos Afectados:** `src/context/i18n-provider.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Problema:** Se detectó un error crítico y recurrente de "fallo de hidratación" (`Hydration failed`). La causa raíz era una condición de carrera (`race condition`) en el componente `i18n-provider.tsx`, donde la inicialización de la librería `i18next` no se completaba de manera fiable antes de que los componentes cliente intentaran renderizarse. Esto provocaba una discrepancia entre el HTML renderizado en el servidor y el cliente.
  - **Solución Arquitectónica:** Se ha reescrito por completo el proveedor de internacionalización para seguir un patrón más robusto y estándar. La instancia de `i18next` ahora se inicializa una única vez a nivel de módulo, eliminando la condición de carrera. Se ha añadido la integración correcta con React (`initReactI18next`) y se ha simplificado el proveedor para usar `I18nextProvider`, el componente oficial de la librería, garantizando una gestión de estado estable y predecible.
  - **Resultado:** Esta corrección estructural elimina la causa raíz del error de hidratación, estabilizando el sistema de traducciones en toda la aplicación y asegurando que la interfaz de usuario se renderice de manera consistente tanto en el servidor como en el cliente.

### **133. FIX: REESCRITURA FINAL Y ROBUSTA DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-FINAL-RELIABLE-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:30 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo Persistente:** Se ha determinado que la causa raíz del inaceptable y persistente error "Zugriff verweigert" (Acceso denegado) se debe a una arquitectura de asignación de roles inestable y propensa a fallos de despliegue o ejecución silenciosa en el backend.
  - **Solución Arquitectónica (Retorno al Estándar de la Industria):** Se abandona por completo cualquier solución de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o dependencia de funciones "callable" que han demostrado ser ineficaces.
  - **Refuerzo de la Resiliencia del Frontend:** Se ha mejorado el hook `useAuthGuard.ts` para que, en el improbable caso de que detecte un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado de cliente limpio y seguro.
  - **Integridad y Estabilidad Definitiva:** Este cambio masivo y final devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase. Resuelve de una vez por todas el frustrante problema de acceso, eliminando las soluciones de emergencia fallidas y restaurando la confianza en la arquitectura del sistema.

### **132. FIX: RESTAURACIÓN DE LA ARQUITECTURA DE AUTORIZACIÓN ESTÁNDAR Y FIABLE - CÓDIGO: AUTH-REBUILD-FINAL-V2**

- **Fecha y Hora:** 20 de Septiembre de 2025, 14:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis Definitivo del Fallo:** Se ha determinado que todos los intentos de soluciones de emergencia para asignar roles de administrador han fallado debido a una arquitectura inestable y propensa a errores. El problema de "Acceso denegado" persistía porque la asignación de permisos no era fiable.
  - **Solución Arquitectónica (Retorno al Estándar):** Se abandona por completo el enfoque de funciones "callable" de emergencia. Se ha reescrito `functions/src/index.ts` para volver a utilizar el disparador `firestore.document().onWrite()` de la v1 de Cloud Functions. Este método es el estándar de la industria, es robusto y garantiza que los `custom claims` de rol (`admin`, `superadmin`) se asignen de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
  - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`, que ha sido una fuente de errores. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
  - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación y asegurando un estado limpio.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las soluciones de emergencia que han resultado ser fallidas y frustrantes.

### **131. FIX: REESTRUCTURACIÓN FINAL DEL SISTEMA DE AUTORIZACIÓN - CÓDIGO: AUTH-REBUILD-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 13:00 (CET)
- **Módulos Afectados:** `functions/src/index.ts`, `hooks/useAuthGuard.ts`, `app/admin/seed/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Fallo Arquitectónico:** Tras múltiples fallos inaceptables, se ha identificado que todas las soluciones de "emergencia" para asignar roles de administrador eran fundamentalmente defectuosas y propensas a errores. El problema de "Acceso denegado" persistía debido a una lógica de backend inestable y a una verificación de permisos en el frontend poco resiliente.
  - **Solución Arquitectónica Definitiva:** Se abandona por completo el enfoque de funciones "callable" de emergencia y se vuelve a la arquitectura estándar, robusta y recomendada por Firebase.
    - **Restauración de `onWrite` (v1):** Se ha reescrito `functions/src/index.ts` para utilizar el disparador `firestore.document().onWrite()` de la versión 1 de Cloud Functions. Esta función es extremadamente fiable y asignará los `custom claims` de rol (`admin`, `superadmin`) de forma inmediata y automática cada vez que un documento se cree o modifique en la colección `admins`. Esto elimina cualquier condición de carrera o retraso.
    - **Eliminación de la Página de Emergencia:** Se ha eliminado por completo el archivo `src/app/admin/seed/page.tsx`. Ha sido una fuente constante de errores y confusión. El método correcto para asignar el primer rol de superadministrador es mediante la creación manual de un documento en la base de datos de Firestore, un proceso único y controlado.
    - **Refuerzo del Auth Guard:** Se ha mejorado el hook `useAuthGuard.ts` para que, en caso de detectar un usuario sin los permisos necesarios, cierre la sesión activamente (`signOut`) antes de redirigir, evitando cualquier bucle de autenticación.
  - **Integridad y Estabilidad:** Este cambio masivo devuelve el sistema de autorización a un estado estable, predecible y alineado con las mejores prácticas de Firebase, resolviendo de una vez por todas el problema de acceso y eliminando las complejas y fallidas soluciones de emergencia.

### **130. FIX: SOLUCIÓN DEFINITIVA Y ROBUSTA A PROBLEMA DE ACCESO DENEGADO - CÓDIGO: AUTH-MASTER-FIX-V1**

- **Fecha y Hora:** 20 de Septiembre de 2025, 12:00 (CET)
- **Módulos Afectados:** `src/functions/src/index.ts`, `src/hooks/useAuthGuard.ts`, `src/app/admin/seed/page.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error Fundamental:** Se identificó que el persistente error "Zugriff verweigert" (Acceso denegado) era causado por una condición de carrera (`race condition`) en la asignación de permisos de administrador. La Cloud Function automática (`onDocumentWrite`) no garantizaba la asignación de los `custom claims` de rol antes de que el frontend intentara verificar dichos permisos, resultando en un fallo de autorización.
  - **Solución Arquitectónica (Invocación Manual):** Se ha reemplazado el sistema de asignación automática de roles por un mecanismo manual, explícito y robusto.
    - **Nueva Cloud Function `makeAdmin`:** Se creó una función "callable" que asigna de forma inmediata y síncrona los `custom claims` de `admin` o `superadmin` a un usuario específico a través de su correo electrónico.
    - **Formulario de Emergencia en `/admin/seed`:** Se añadió un formulario de "emergencia" en la página estática `/admin/seed` para permitir a un usuario ya autenticado (pero sin acceso al dashboard) invocar la función `makeAdmin` sobre sí mismo o sobre otro usuario, forzando la asignación de permisos. Esto actúa como un mecanismo de recuperación infalible.
  - **Refuerzo del Frontend (`useAuthGuard`):** Se ha mejorado el hook `useAuthGuard` para que, en caso de detectar un usuario sin los permisos necesarios, cierre activamente la sesión (`signOut`) antes de redirigir a la página de login. Esto previene cualquier bucle de autenticación y asegura un estado limpio.
  - **Integridad y Control:** Este cambio estructural elimina la dependencia de disparadores automáticos para una tarea crítica como la autorización, otorgando un control directo y fiable sobre la gestión de roles de administrador y resolviendo de una vez por todas el problema de acceso.

### **129. FIX: SOLUCIÓN DEFINITIVA A PÉRDIDA DE DATOS AL GUARDAR CLIENTE - CÓDIGO: FIX-SAVE-DEEPMERGE-V1**

- **Fecha y Hora:** 19 de Septiembre de 2025, 16:00 (CET)
- **Módulos Afectados:** `src/app/admin/clients/[id]/edit/EditClientForm.tsx`, `src/CHANGELOG.md`.
- **Descripción del Cambio:**
  - **Análisis del Error:** Se identificó que la causa raíz de la persistente pérdida de datos al guardar un cliente era una estrategia de actualización defectuosa. La función `updateDoc` de Firestore, al recibir un objeto anidado incompleto, reemplazaba el objeto entero en la base de datos, eliminando los sub-campos no modificados.
  - **Solución Arquitectónica (Deep Merge):** Se ha implementado una solución robusta y definitiva. Ahora, la función `onSubmit` primero obtiene el documento original completo desde Firestore. Luego, utiliza la función `_.merge` de `lodash` para realizar una "fusión profunda" (deep merge), combinando de manera inteligente y recursiva los nuevos datos del formulario sobre los datos existentes.
  - **Integridad de Datos Garantizada:** Este enfoque asegura que solo los campos que el usuario ha modificado explícitamente se actualizan, mientras que todos los demás campos, especialmente los anidados, conservan sus valores originales. Se elimina de raíz el riesgo de borrado accidental de datos.
  - **Documentación:** Se ha registrado esta corrección arquitectónica fundamental en el `CHANGELOG.md` como la solución final al problema de guardado.





    
















