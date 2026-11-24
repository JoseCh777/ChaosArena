# ChaosArena

Quiz web multijugador para evaluar patrones de diseño. Jose desarrolla el frontend y Daniel el backend. El MVP contempla una sala en memoria, editor JSON, PIN, apodos, dos marcadores, eventos, votaciones y proyector.

## Estado inicial

La arena compartida usa el PIN de práctica 482913. Abre dos navegadores con apodos diferentes. La primera persona que ingresa puede iniciar con las preguntas de muestra o con un cuestionario del editor. Cada jugador recibe su vista por Socket.IO.

El servidor revela la solución cuando todos han respondido. Si vence el tiempo con respuestas pendientes, cierra la ronda por tiempo. Al completar todos la pregunta, realiza un sorteo del 30 %. Si sale un evento, la ruleta se reproduce en todos los clientes y el servidor avanza automáticamente. El editor conserva su borrador en el navegador y la sala vive en la memoria del servidor.

## Desarrollo local

Requisitos Node.js 22.12 o superior y npm. Ejecutar desde la raíz del repositorio.

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm run dev
```

Frontend en http://localhost:5173 y backend en http://localhost:3001/health. Completar HOST_KEY en backend/.env antes de implementar la creación de salas. Las variables del frontend son públicas. Guardar HOST_KEY y tokens del anfitrión únicamente en los flujos privados correspondientes.

```powershell
npm run typecheck
npm run build
npm start -w backend
```

El lockfile y la instalación se gestionan desde la raíz. Para teléfonos en red local consultar docs/ARQUITECTURA.md.

## Organización

- frontend/src/components, pages y services para Jose. Recursos locales en frontend/public/brand y media.
- backend/src para Daniel. Módulos previstos en docs/PLAN-DANIEL.md.
- shared/types.ts para el contrato acordado por ambos.
- docs para contexto, planes, integración y referencias originales.

## Ramas

Trabajo en frontend y backend, integración mediante PR a develop y entrega mediante PR de develop a main. Ver [flujo de trabajo](docs/FLUJO-GIT.md).

## Documentación

Empezar por [el índice](docs/README.md) y [el plan maestro](docs/PLAN-MAESTRO.md). El estado de tareas verificadas se registra en [seguimiento](docs/SEGUIMIENTO.md).
