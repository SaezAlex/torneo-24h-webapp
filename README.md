# App torneo 24 horas

Este proyecto hace referencia a la aplicación de gestión/seguimiento del torneo 24h de Castro Urdiales. 

## Descripción
El archivo principal de referencia para este proyecto es "App torneo 24 horas". La aplicación está diseñada para manejar los datos y la lógica detrás de un evento de 24 horas continuas.

## Tecnologías y Servicios
*   **Base de Datos:** La aplicación está vinculada a un proyecto de Firebase y utiliza una base de datos en tiempo real (Realtime Database) bajo el nombre `torneo-24h-castro-default-rtdb`.
*   **Seguridad de Firebase:** Durante el desarrollo, la base de datos se inició en "Modo de prueba" (Test Mode). 

## Notas de Desarrollo y Mantenimiento
*   **Actualización de Reglas:** Es imperativo actualizar las reglas de seguridad de la base de datos de Firebase. Si la base de datos permanece abierta a Internet sin reglas de seguridad estrictas tras el periodo de gracia inicial de 30 días, el acceso de cliente a la base de datos caducará y se denegarán todas las solicitudes de la app.
*   **Referencias:** Para más detalles sobre la estructura o la implementación, consulta directamente el archivo "App torneo 24 horas".
