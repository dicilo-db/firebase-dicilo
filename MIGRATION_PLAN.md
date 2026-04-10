# Plan de Migración de Entorno de Desarrollo

**Prioridad:** ALTA (Crítica para performance)
**Estado:** Pendiente

## Problema Actual
El proyecto reside actualmente en una carpeta sincronizada con iCloud Drive:
`/Users/niloescolar/Library/Mobile Documents/com~apple~CloudDocs/...`

**Impacto:**
- Tiempos de respuesta del servidor de desarrollo extremadamente lentos (>30s - 60s).
- Errores de "File System" y bloqueos debido a la sincronización constante de `node_modules` y `.next`.
- Linter y builds inestables.

## Acción Requerida
Mover el proyecto a una ubicación local fuera de la sincronización de iCloud en el nuevo equipo de trabajo dedicado.

### Pasos para la Migración

1.  **En el Nuevo Equipo:**
    Crear un directorio de proyectos local:
    ```bash
    mkdir -p /Users/niloescolar/Proyectos
    cd /Users/niloescolar/Proyectos
    ```

2.  **Clonar el Repositorio:**
    Usar Git para bajar la última versión (asegurar que todos los cambios actuales estén empujados):
    ```bash
    git clone https://github.com/dicilo-db/firebase-dicilo.git
    cd firebase-dicilo
    ```

3.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

4.  **Configurar Variables de Entorno:**
    Copiar el archivo `.env.local` (este no se sube a git) manualmente desde el entorno actual al nuevo.
    *Nota: Si usas Firebase Admin SDK con credenciales JSON, asegúrate de mover también ese archivo.*

5.  **Iniciar Desarrollo:**
    ```bash
    npm run dev
    ```

### Resultado Esperado
- Tiempos de carga < 2s.
- HMR (Hot Module Replacement) instantáneo.
- Estabilidad en consola.
