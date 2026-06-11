# META-036 - Frontend UX foundation

## Decision

La trigesima sexta meta implementable de FormulIA Cloud es crear la base UX del frontend real.

Esta meta convierte el plan de refactor UX en un primer corte ejecutable: la app debe dejar de presentarse como una consola unica con todas las capacidades visibles y pasar a una navegacion de producto centrada en `Formula actual`.

## Contexto

El frontend actual ya existe en `apps/web` y concentra casi toda la experiencia en `apps/web/app/page.tsx`.

El componente principal mezcla workspace, parametros, integraciones Jira, materias primas, aliases, compatibilidad, biblioteca, comparador, importacion Excel, parser IA, resultados, historial y reviews Jira. La navegacion lateral refleja esa mezcla con 9 entradas al mismo nivel.

El objetivo de esta meta no es embellecer la pantalla. El objetivo es reducir sobrecarga cognitiva y crear una estructura de interfaz que sirva primero al uso real del tenant piloto:

- preparar una formula,
- gestionar materias primas,
- importar formulas historicas desde Excel,
- calcular coste y riqueza,
- revisar warnings,
- guardar o enviar a revision cuando haga falta.

## Alcance incluido

- Rama recomendada: `codex/frontend-ux-foundation`.
- Hacer que `Formula actual` sea la primera experiencia del usuario.
- Reducir la navegacion visible a las entradas MVP:
  - `Formula actual`,
  - `Materias primas`,
  - `Importar Excel`,
  - `Resultados`,
  - `Configuracion`.
- Mantener funciones avanzadas accesibles sin hacerlas competir en la navegacion principal.
- Mover visualmente Jira/Integraciones a `Configuracion`.
- Mantener el panel de revision Jira dentro de la formula, porque el envio a laboratorio forma parte del ciclo de vida de una formula.
- Introducir un shell o estructura equivalente que permita separar flujos sin reescribir backend.
- Empezar a extraer primitivas UI si reduce complejidad real, con minimo:
  - botones,
  - estados/badges,
  - cabeceras de pagina,
  - paneles de resumen.
- Actualizar documentacion de delivery si el corte cambia el orden de trabajo.

## Fuera de alcance

- Redisenar visualmente toda la aplicacion.
- Reescribir importacion Excel como wizard completo.
- Reescribir materias primas como tabla con panel lateral completo.
- Separar biblioteca y comparador por completo.
- Reescribir IA.
- Introducir auth real.
- Eliminar `userId` hardcodeado.
- Cambiar endpoints.
- Cambiar reglas de negocio.
- Cambiar el backend.
- Instalar Tailwind, shadcn/ui, TanStack Query/Table, React Hook Form o Zod salvo que sea imprescindible para este corte.

## Criterios de done

1. La primera pantalla del usuario es `Formula actual`.
2. La navegacion visible baja de 9 entradas planas a 5 entradas principales.
3. Jira/Integraciones queda bajo `Configuracion`, no como entrada principal.
4. El usuario puede seguir creando workspace, parametro, materia prima y formula.
5. El usuario puede seguir calculando una formula con el backend.
6. El usuario puede seguir accediendo a importacion Excel, resultados, compatibilidad, biblioteca, IA e integraciones, aunque algunas queden agrupadas.
7. No se cambian contratos API.
8. `npm run check` pasa.
9. `git diff --check` pasa.
10. Smoke browser desktop y mobile confirma que la app carga, no hay pantalla en blanco y no hay solapamientos graves en la primera experiencia.

## Testing minimo

- `npm run check`.
- `git diff --check`.
- Smoke browser desktop:
  - abrir la app,
  - verificar que `Formula actual` es la vista inicial,
  - cambiar a `Materias primas`,
  - cambiar a `Importar Excel`,
  - cambiar a `Configuracion`.
- Smoke browser mobile:
  - verificar que la navegacion se puede usar,
  - verificar que botones y textos principales no se solapan.

## Riesgos

- Romper comportamiento al mover demasiado JSX.
- Crear rutas separadas que pierdan estado local de la sesion actual.
- Ocultar funcionalidades que todavia son necesarias para pruebas reales.
- Confundir "Jira fuera del flujo principal" con "Jira inaccesible".
- Iniciar una migracion de stack antes de tener boundaries claros.

## Estrategia recomendada

Para este primer corte, priorizar una reorganizacion conservadora:

- mantener estado y llamadas API donde estan si moverlos aumenta el riesgo;
- crear una navegacion por vistas o shell interno antes de partir todo en rutas reales;
- dejar las rutas fisicas de Next para un corte posterior si el estado local actual hace que se pierda trabajo al navegar;
- extraer componentes solo donde la repeticion ya sea clara;
- no tocar calculo ni modelos.

## Referencia

Plan completo: [`../05-delivery/frontend_ux_refactor_plan.md`](../05-delivery/frontend_ux_refactor_plan.md).

## Siguiente accion recomendada

Implementar el shell/navegacion MVP y validar que la primera experiencia queda centrada en `Formula actual` sin romper los flujos existentes.
