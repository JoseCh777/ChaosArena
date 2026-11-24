# Arquitectura y ejecución

Monorepo npm con frontend React/Vite/TypeScript, backend Node/Express/Socket.IO y shared para tipos. El servidor será la autoridad y mantendrá una sala en memoria. El editor guardará JSON en el navegador del anfitrión.

```text
ChaosArena/
  frontend/
    src/
      components/
      pages/
      services/socket.ts
      styles/{base,tokens}.css
      App.tsx
      main.tsx
    public/{brand,media}/
    .env.example
  backend/
    src/server.ts
    .env.example
  shared/types.ts
  docs/
    references/Chaos Arena.docx
    design-system.html
  package.json
  package-lock.json
  tsconfig.base.json
```

Los módulos de negocio se incorporarán según el plan de Daniel. Los tipos se importan con import type para que el backend compile sin copiar código de shared al ejecutable. Si se agrega lógica compartida en ejecución, acordar su compilación y distribución antes de cambiar este mecanismo.

## Variables

| Archivo local | Variable | Uso |
| --- | --- | --- |
| backend/.env | PORT | Puerto HTTP y Socket.IO, por defecto 3001 |
| backend/.env | CLIENT_ORIGIN | Origen autorizado del navegador, por defecto http://localhost:5173 |
| backend/.env | HOST_KEY | Credencial privada para crear la sala en producción |
| frontend/.env | VITE_SOCKET_URL | Dirección del backend accesible por el navegador |

Los archivos .env se excluyen de Git y se generan desde cada .env.example. El servidor carga backend/.env con Node/tsx. Valida HOST_KEY al crear la sala en producción y expone /health y Socket.IO.

## Arranque

Desde la raíz, npm ci y npm run dev. También npm run dev:backend o npm run dev:frontend. npm run typecheck valida los tres workspaces. npm run build compila backend y frontend. npm start -w backend ejecuta backend/dist/server.js y npm run preview -w frontend sirve el build frontend para inspección.

## Red local

Dejar VITE_SOCKET_URL vacío para usar el proxy de Vite. Ejecutar `npm run dev:backend` en una terminal y `npm run dev -w frontend -- --host` en otra. Abrir `/display` usando la URL Network de Vite, crear la sala desde `/host` y escanear el QR en la misma red privada.

## Despliegue previsto

Los archivos `render.yaml` y `vercel.json` parten de la raíz del repositorio y usan el lockfile común. Los servicios se crean cuando se integren los cambios de la entrega.

1. En Render, crear el Web Service con el Blueprint y configurar `HOST_KEY` en el servicio. Verificar que `/health` devuelva 200. El Blueprint deja los despliegues automáticos desactivados para que se pueda elegir cuándo reiniciar la sala. [Blueprint de Render](https://render.com/docs/blueprint-spec)
2. En Vercel, importar el repositorio y mantener la raíz en el nivel del monorepo. Configurar `VITE_SOCKET_URL` con el origen HTTPS de Render. El archivo de configuración compila el workspace frontend, publica `frontend/dist` y habilita los enlaces directos de la aplicación. [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)
3. En Render, configurar `CLIENT_ORIGIN` con el origen exacto del frontend y desplegar. Después, abrir `/host` desde la URL pública, crear la sala y comprobar el QR de `/display` y la reconexión.
4. Registrar el ensayo con teléfonos y proyector en SEGUIMIENTO.md. La contingencia es hacer la partida en red local o usar el cuestionario revisado con una hoja de registro manual de respuestas.
