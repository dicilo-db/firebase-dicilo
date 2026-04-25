# Dicilo Gallery All-in-One Plugin - Technical Whitepaper

## 1. Introducción
El plugin **Dicilo Gallery All-in-One** ha sido refactorizado a su versión 3.1.1 para incluir mejoras sustanciales en rendimiento, adaptabilidad visual, experiencia de usuario y mantenibilidad a largo plazo. 

Esta documentación sirve como punto de referencia arquitectónico para entender las nuevas capacidades integradas y el mecanismo por el cual el plugin puede distribuirse y actualizarse en múltiples sitios web de clientes sin intervención manual ni pérdida de datos.

## 2. Nuevas Características Implementadas

### A. Control de Reproducción Automática (Autoplay)
Se ha dotado de la funcionalidad para que los carruseles pasen de imagen automáticamente. Los intervalos son estrictamente configurables (3, 6, 9 y 12 segundos) para permitir adaptación al tipo de contenido (ej. lectura de texto vs simple visualización de fotos), o puede mantenerse en modo manual.

### B. Proporciones Nativas (Aspect Ratios) mediante CSS Moderno
En lugar de forzar a los administradores a recortar sus imágenes en Photoshop antes de subirlas, el plugin ahora aplica recortes dinámicos mediante CSS (`object-fit` y `aspect-ratio`).
- **Cuadrado (1:1):** Estilo Instagram Feed.
- **Retrato (4:5):** Estilo Instagram Vertical (ocupa más pantalla).
- **Vertical (9:16):** Estilo Stories / Reels / TikTok.
- **Panorámico (16:9):** Estilo YouTube / Pantallas de TV.
- **Auto:** Mantiene el formato y alto original de la imagen sin alteraciones.

### C. Compresión Inteligente a WebP (Al vuelo)
Cualquier archivo JPG o PNG subido a WordPress mediante el selector de imágenes de la galería es interceptado durante el proceso nativo de carga (`wp_handle_upload`). 
- El plugin invoca el motor de imágenes de WordPress (`WP_Image_Editor`).
- Comprime la calidad al 80% (óptimo para web).
- Convierte el formato nativamente a `.webp`.
- **Elimina el archivo original** para ahorrar espacio en disco en el servidor.
- Re-enruta las URL en la base de datos para apuntar al nuevo archivo WebP.

### D. Sistema Nativo de Actualización Remota (GitHub Updater / OTA)
Se integra un sistema avanzado de "Over The Air" (OTA) updates mediante conexión directa a la API pública de GitHub. El plugin "engaña" a WordPress inyectando metadatos en el objeto `site_transient_update_plugins`, haciendo creer a WordPress que la actualización proviene del repositorio oficial (wordpress.org).

---

## 3. Integridad de Datos y Proceso de Actualización

### ¿Por qué los clientes NO pierden datos al actualizar?
La arquitectura principal de WordPress mantiene una separación estricta entre la **Lógica de Ejecución (Archivos)** y la **Información del Usuario (Base de Datos)**.

1. **La Base de Datos (MySQL/MariaDB):** 
   - Las configuraciones del plugin, los custom post types (las galerías creadas), la información de las imágenes (URL, textos, enlaces) y los *meta boxes* se guardan exclusivamente en las tablas `wp_posts` y `wp_postmeta`.
   - Las imágenes físicas residen en la carpeta `/wp-content/uploads/`.
2. **Los Archivos del Plugin (.php, .js, .css):**
   - Residen en `/wp-content/plugins/dicilo-gallery/`.
   - Únicamente contienen las instrucciones matemáticas y estructurales de cómo leer la base de datos y cómo mostrar el contenido en pantalla.

**Conclusión:** Cuando un administrador pulsa el botón "Actualizar Plugin" en WordPress, el sistema descarga el nuevo ZIP desde GitHub y **sobrescribe únicamente los archivos PHP**. La base de datos y la carpeta `uploads` jamás son tocadas por este proceso. Por lo tanto, todas las galerías previamente construidas por el cliente permanecen 100% intactas y seguras.

---

## 4. Guía Operativa: Cómo lanzar una actualización a los clientes

Para que una nueva versión del código llegue automáticamente a los paneles de administración de todos los clientes que usan el plugin, sigue este flujo de trabajo:

### Paso 1: Configurar el Repositorio (Solo una vez)
En el archivo `dicilo-all-in-one.php`, asegúrate de que las constantes apunten a tu repositorio en GitHub:
```php
define('DICILO_GITHUB_USER', 'dicilo-db'); 
define('DICILO_GITHUB_REPO', 'dicilo-gallery-plugin');
```

### Paso 2: Desarrollo Local
Realiza los cambios que necesites en el código PHP/JS/CSS localmente.
**CRÍTICO:** Debes aumentar el número de versión en la cabecera del archivo `dicilo-all-in-one.php`.
```php
* Version: 3.2.0
```

### Paso 3: Subir a GitHub
Sube (Push) tus cambios a la rama `main` (o `master`) de tu repositorio de GitHub. El repositorio **debe ser público** para que los sitios de los clientes puedan leerlo sin requerir tokens de autenticación.

### Paso 4: Crear una 'Release' (Lanzamiento)
1. Ve a la página de tu repositorio en GitHub.
2. En la barra lateral derecha, haz clic en **Releases** y luego en **Draft a new release**.
3. Haz clic en **Choose a tag** y escribe la nueva versión. 
   - **IMPORTANTE:** El tag debe empezar por 'v' y coincidir con la versión del PHP (ejemplo: `v3.2.0`).
4. Añade un título (ej. "Versión 3.2.0 - Nuevas opciones de color") y una descripción.
5. Haz clic en **Publish release**.

### Paso 5: Propagación Automática
Inmediatamente después de publicar la Release en GitHub, los sitios WordPress de tus clientes que hagan una comprobación rutinaria de actualizaciones (o si el administrador entra a `Dashboard > Updates`) conectarán con la API de GitHub.
Al detectar que `3.2.0` es mayor que la versión instalada (`3.1.1`), aparecerá el aviso naranja estándar de WordPress: **"Hay una nueva versión de Dicilo Gallery All-in-One disponible."**
El cliente solo tendrá que pulsar "Actualizar ahora" y el proceso de extracción y reemplazo de archivos se realizará de forma automática.
