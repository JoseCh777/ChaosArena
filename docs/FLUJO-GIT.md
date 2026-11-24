# Flujo de trabajo Git

Repositorio compartido https://github.com/JoseCh777/ChaosArena. Jose trabaja en frontend y Daniel en backend. La rama de integración se llama develop por solicitud del equipo. La rama de entrega se llama main.

| Rama | Responsable | Integración |
| --- | --- | --- |
| main | Ambos validan y Jose integra la entrega | Recibe PR desde develop |
| develop | Ambos | Recibe PR desde frontend y backend |
| frontend | Jose | Nace de develop y entrega PR hacia develop |
| backend | Daniel | Nace de develop y entrega PR hacia develop |

## Inicio de jornada

Trabajar con el árbol limpio y guardar cambios propios antes de actualizar. Jose utiliza frontend en los siguientes comandos. Daniel sustituye frontend por backend.

```powershell
git switch frontend
git pull --ff-only origin frontend
git fetch origin
git merge origin/develop
```

Para una tarea adicional se puede crear feature/nombre-descriptivo directamente desde develop y abrir PR a develop. Mantener cada cambio con alcance concreto.

## Entregar un cambio

```powershell
npm run typecheck
npm run build
git add <archivos-de-la-tarea>
git commit -m "feat: implementar ingreso al lobby"
git push
```

Abrir PR frontend → develop o backend → develop y describir comportamiento, validación y pendientes. Revisar juntos shared/ y los flujos conectados. Incorporar develop nuevamente a las ramas después de integrar. Resolver conflictos preservando el contrato acordado y volver a comprobar el flujo afectado.

## Entrega a main

Abrir PR develop → main tras una partida completa verificada. Ambos revisan la aceptación de SEGUIMIENTO.md y Jose integra. Desplegar desde main en la fase prevista. Actualizar develop desde main si la integración genera cambios adicionales.

Evitar force push y secretos en commits. El lockfile raíz se actualiza en el mismo PR que cambia dependencias. Mantener frontend/ a cargo de Jose, backend/ a cargo de Daniel y shared/ de común acuerdo. Las ramas y este acuerdo constituyen el flujo inicial. La configuración de protección en GitHub puede acordarse posteriormente.
