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
| backend/.env | HOST_KEY | Credencial privada para futura creación de sala |
| frontend/.env | VITE_SOCKET_URL | Dirección del backend accesible por el navegador |

Los archivos .env se excluyen de Git y se generan desde cada .env.example. El servidor inicial carga backend/.env con Node/tsx. HOST_KEY se validará al implementar room:create. El arranque actual expone /health y el transporte Socket.IO. Las mecánicas están pendientes.

## Arranque

Desde la raíz, npm ci y npm run dev. También npm run dev:backend o npm run dev:frontend. npm run typecheck valida los tres workspaces. npm run build compila backend y frontend. npm start -w backend ejecuta backend/dist/server.js y npm run preview -w frontend sirve el build frontend para inspección.

## Red local

Configurar VITE_SOCKET_URL con http://IP-DEL-PORTATIL:3001 y CLIENT_ORIGIN con http://IP-DEL-PORTATIL:5173. Reiniciar ambos procesos después del cambio. Ejecutar npm run dev:backend en una terminal y npm run dev:frontend -- --host 0.0.0.0 en otra. Abrir http://IP-DEL-PORTATIL:5173 desde teléfonos en la misma red que permita comunicación entre dispositivos. Comprobar firewall de la red privada y conexión Socket.IO real.

## Despliegue previsto

Usar la raíz del monorepo para instalar con npm ci. Backend con npm run build -w backend y npm start -w backend. Frontend con npm run build -w frontend y salida frontend/dist. Acordar rewrite SPA al añadir las rutas. Configurar VITE_SOCKET_URL con HTTPS backend y CLIENT_ORIGIN con el origen frontend. Revisar cuotas y acceso de ambos autores antes de elegir planes. Esta estructura prepara el build, y el despliegue corresponde a jornada cuatro.
