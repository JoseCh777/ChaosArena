# ChaosArena

Quiz web multijugador para evaluar patrones de diseño. Jose desarrolla el frontend y Daniel el backend. El MVP contempla una sala en memoria, editor JSON, PIN, apodos, dos marcadores, eventos, votaciones y proyector.

## Estado inicial

Abre `/host`, escribe tu apodo y crea la sala. El servidor genera un PIN de seis dígitos. Comparte ese PIN o el QR de `/display` y abre otros navegadores con apodos distintos. El anfitrión puede iniciar con las preguntas de muestra o con un cuestionario del editor.

Antes de iniciar, abre **Ajustes de partida** desde `/host`. Elige 30 segundos por defecto, otro tiempo de 10 a 60 segundos para todas las preguntas o los tiempos del cuestionario. Puedes encender las votaciones y elegir un clip o ninguno para cada momento del proyector.

El servidor revela la solución cuando todos han respondido. Si vence el tiempo con respuestas pendientes, cierra la ronda por tiempo. Al completar todos la pregunta, realiza un sorteo del 30 %. Si sale un evento, la ruleta se reproduce en todos los clientes y el servidor avanza automáticamente. El editor conserva su borrador en el navegador y la sala vive en la memoria del servidor.

## Desarrollo local

Requisitos Node.js 22.12 o superior y npm. Ejecutar desde la raíz del repositorio.

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm run dev
```

Frontend en http://localhost:5173 y backend en http://localhost:3001/health. Configura HOST_KEY en backend/.env para reservar la creación de salas. En producción es obligatorio. Las variables del frontend son públicas. Guardar HOST_KEY y tokens del anfitrión únicamente en los flujos privados correspondientes.

```powershell
npm run typecheck
npm run build
npm start -w backend
```

El lockfile y la instalación se gestionan desde la raíz. Para teléfonos en red local consultar docs/ARQUITECTURA.md.

### Ensayo en el aula

Importa [el cuestionario de ensayo](docs/cuestionario-ensayo.json) desde `/editor` para practicar con 15 preguntas. El proyector puede mostrar clips al iniciar, al votar, durante la ruleta y al llegar al podio.

Crea la sala en `/host`, configura las votaciones y elige el cuestionario antes de iniciar. Abre `/display` en la pantalla que vas a proyectar. El QR utiliza el origen desde el que abriste el proyector.

Para probar con teléfonos en la misma red, arranca el backend con `npm run dev:backend` y el frontend en otra terminal con `npm run dev -w frontend -- --host`. Abre `/display` usando la URL Network que muestra Vite. Si usas una URL localhost, el QR solo sirve en el mismo equipo. Mantén el backend y el frontend encendidos durante el ensayo.

## Organización

- frontend/src/components, pages y services para Jose. Recursos locales en frontend/public/brand y media.
- backend/src para Daniel. Módulos previstos en docs/PLAN-DANIEL.md.
- shared/types.ts para el contrato acordado por ambos.
- docs para contexto, planes, integración y referencias originales.

## Ramas

Trabajo en frontend y backend, integración mediante PR a develop y entrega mediante PR de develop a main. Ver [flujo de trabajo](docs/FLUJO-GIT.md).

## Documentación

Empezar por [el índice](docs/README.md) y [el plan maestro](docs/PLAN-MAESTRO.md). El estado de tareas verificadas se registra en [seguimiento](docs/SEGUIMIENTO.md).
