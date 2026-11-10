# Nexo Medical

Aplicación web para gestión de atención podológica: pacientes, historias clínicas, agenda, operación clínica, administración, catálogos y reportes.

## Estructura

- `public/`: interfaz web, estilos y scripts del cliente.
- `api/`: funciones del servidor.
- `migrations/`: migraciones SQL ordenadas.
- `hatchable.toml`: metadatos del proyecto en Hatchable.

## Estado y advertencias

Este repositorio refleja el código fuente de la versión desplegada en Hatchable al momento de la exportación.

- La agenda operativa todavía utiliza datos de demostración almacenados en la sesión del navegador; no se debe asumir persistencia real de citas a partir de esa interfaz.
- La autenticación de la aplicación no está habilitada en el proyecto exportado. Las declaraciones `access = "admin"` en las rutas no sustituyen una configuración efectiva de identidad, roles y autorización.
- No utilizar con datos personales o clínicos reales hasta implementar y verificar autenticación, autorización por rol, aislamiento por organización, auditoría, respaldos, políticas de retención y medidas de seguridad.
- Los catálogos CIE-10, CUPS, CIIU y RIPS tienen soporte de estructura/versionado; las listas oficiales deben importarse desde fuentes autorizadas antes de uso operativo.
- No contiene credenciales ni secretos. Configura los valores requeridos en el entorno de despliegue, nunca dentro del repositorio.

## Despliegue

El proyecto original está alojado en Hatchable. Este repositorio es una copia del código fuente y no incluye credenciales, datos de la base de datos ni un volcado de información de pacientes.

Consulta la documentación de Hatchable para configurar el proyecto, sus variables de entorno y migraciones en un entorno propio.
