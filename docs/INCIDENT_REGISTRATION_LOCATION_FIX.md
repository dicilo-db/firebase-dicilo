# Informe de Incidencia: Datos de Ubicación en Registros y Creación de Empresa

## Problema Reportado
1. **Falta de visibilidad de ubicación:** En el panel de administración de registros (`/admin/registrations`), no era posible ver desde qué ciudad o país se había registrado un usuario o empresa. Solo se mostraba el nombre, el contacto y el tipo de registro.
2. **Pérdida de datos al crear empresa:** Al hacer clic en "Aprobar y Crear Empresa", el formulario resultante (`/admin/basic/new`) aparecía en blanco en los campos de ubicación (País, Ciudad, Dirección) y teléfono, a pesar de que el usuario ya había introducido esa información durante su registro.

## Causa Raíz
* **Tabla de Registros:** La tabla principal de la interfaz de administración no estaba configurada para extraer y mostrar las variables `city` y `country` de la base de datos de Firebase.
* **Flujo de Creación de Empresa:** El botón "Aprobar y Crear Empresa" generaba una URL que solo enviaba el `name`, el `email` y el `tier` mediante parámetros de búsqueda (query parameters). Además, el formulario de destino (`page.tsx` de basic/new) estaba preconfigurado rígidamente para poner siempre "Hamburg" y "Deutschland", ignorando los datos reales del registro.

## Solución Implementada

### 1. Panel de Registros (`src/app/admin/registrations/page.tsx`)
* Se ha añadido una nueva columna llamada **"Ubicación"** a la tabla de registros.
* Ahora la tabla muestra explícitamente la **Ciudad** (en texto destacado) y el **País** (en texto secundario) para cada registro. En caso de que un registro antiguo no tenga estos datos, mostrará "Sin ciudad" y "Sin país".
* Se ha modificado el enlace dinámico del botón de acción **"Aprobar y Crear Empresa"**. Ahora la URL transfiere todos los datos cruciales:
  * `city`
  * `country`
  * `phone` (o `whatsapp`)
  * `address`

### 2. Formulario de Nueva Empresa (`src/app/admin/basic/new/page.tsx`)
* Se ha implementado lógica para leer y procesar los nuevos parámetros enviados por la URL (`searchParams`).
* Los valores por defecto ("Hamburg" / "Deutschland") han sido sustituidos por los datos pre-rellenados dinámicos.
* Ahora, cuando apruebas un registro, el formulario inyecta automáticamente la ciudad, el país, el teléfono y la dirección exacta que el usuario dejó en el registro.

## Resultado
A partir de ahora, puedes ver de un vistazo en la tabla de dónde es cada solicitud de registro. Al proceder a crear su perfil de negocio, todo su contexto geográfico y de contacto se transferirá al nuevo formulario automáticamente, evitando la reintroducción manual de datos.
