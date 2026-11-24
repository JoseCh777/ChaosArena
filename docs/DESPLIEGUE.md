# Desplegar ChaosArena

## GitHub

Integra los PR en orden de dependencia. Revisa la versión resultante en `develop` y abre el PR de `develop` a `main` para publicarla. Conserva las ramas base hasta integrar sus PR dependientes.

## Backend en Render

1. Elige **New → Blueprint**, conecta `JoseCh777/ChaosArena` y selecciona `main`.
2. Configura `HOST_KEY` con una clave privada para el anfitrión. Usa temporalmente `http://localhost:5174` como `CLIENT_ORIGIN` hasta conocer el dominio final de Vercel.
3. Espera a que el servicio esté activo. Abre su URL con `/health` y verifica que responde con `status: ok`. Copia la URL HTTPS del servicio, sin `/health`.

## Frontend en Vercel

1. Importa el mismo repositorio con `main` como rama de producción y deja **Root Directory** en la raíz.
2. Agrega `VITE_SOCKET_URL` con la URL HTTPS de Render. `vercel.json` usa `npm run build -w frontend` y publica `frontend/dist`.
3. Despliega y copia el dominio final de Vercel. Vuelve a Render, cambia `CLIENT_ORIGIN` por ese origen exacto, sin barra final, y redespliega.
4. Abre `/host` en Vercel. Usa la clave configurada en Render para crear una sala.

Render tiene el despliegue automático desactivado. Actualiza el backend entre partidas, porque la sala vive en memoria.

## Ensayo antes de la exposición

- Abre el anfitrión y el proyector en ventanas separadas si usas dos pantallas. Prueba el PIN desde dos teléfonos.
- Activa el audio en la salida seleccionada y verifica acierto, error y ruleta. Usa una partida corta de 16 preguntas para medir el ritmo completo.
- Llega al podio y descarga el CSV desde el anfitrión. Compara un par de filas con el resultado de cada participante.
- El build público incluye clips existentes y señales originales de respaldo. Los recursos de la carpeta local de ensayo quedan fuera hasta contar con los permisos de publicación.
