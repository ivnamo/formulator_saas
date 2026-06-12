# META-049 - Refactor del panel de materias primas

## Decision

La cuadragesima novena meta implementable de FormulIA Cloud es separar el panel de materias primas y aliases del `Home`.

## Contexto

`Home` aun contenia el formulario de materia prima, tabla de materias, botones para añadir a formula y editor de aliases. La logica de creacion, detalle y alias sigue perteneciendo a la pagina, pero el render del panel puede vivir en un componente presentacional.

## Alcance de esta slice

- Crear `apps/web/app/raw-materials-panel.tsx`.
- Mover al panel:
  - formulario de alta de materia prima,
  - tabla de materias primas,
  - boton para añadir materia a formula,
  - listado y alta de aliases por materia.
- Mantener en `page.tsx`:
  - llamadas API,
  - `materialForm`,
  - `aliasInputs`,
  - mutaciones de workspace/formula.

## Fuera de alcance

- Cambiar endpoints de materias primas.
- Cambiar el comportamiento de alias.
- Cambiar filtros avanzados del catalogo del builder.

## Criterios de done

1. `page.tsx` no contiene el JSX de la seccion `materials`.
2. Typecheck y build web pasan.
3. Browser local carga `Materias primas` sin errores de consola.
4. Worktree queda limpio tras commit y push.

## Siguiente accion recomendada

Extraer compatibilidad o resultados, que son los siguientes paneles autocontenidos dentro de `Home`.
