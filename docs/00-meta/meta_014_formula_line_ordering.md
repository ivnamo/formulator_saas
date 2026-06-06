# META-014 - Formula line ordering

## Decision

La decimocuarta meta implementable de FormulIA Cloud es hacer mas comodo el editor de formulas permitiendo reordenar lineas.

El backend ya almacena `order_index`; esta meta convierte ese campo en comportamiento visible y probado: el usuario puede mover materias dentro de una formula y el orden se conserva al guardar, abrir y exportar.

## Alcance incluido

- Rama `feature/formula-line-ordering`.
- Controles UI para mover lineas de formula arriba y abajo.
- Persistencia del orden usando `order_index` ya existente.
- Apertura de formulas respetando el orden guardado.
- Export Excel respetando el orden guardado.
- Test API que verifica orden guardado y reordenado.
- Smoke local que reordena dos lineas, guarda y reabre.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Drag and drop.
- Agrupaciones o secciones de formula.
- Duplicar lineas.
- Buscador de materias dentro del editor.
- Validaciones avanzadas por rango de ingrediente.
- Edicion multiusuario concurrente.

## Criterios de done

1. La UI muestra controles para subir/bajar lineas.
2. Los controles no rompen el layout ni permiten mover fuera de rango.
3. El payload de guardado conserva el orden visual.
4. Al abrir una formula guardada, las lineas aparecen en el orden persistido.
5. El export Excel mantiene el mismo orden.
6. Tests/checks pasan.
7. Quality/refactor gate queda aplicado.
8. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Smoke local:
  1. crear workspace,
  2. crear dos materias,
  3. anadir ambas a formula,
  4. mover la segunda arriba,
  5. calcular/guardar,
  6. abrir desde biblioteca y verificar el orden.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No depender solo del orden local en memoria si el backend devuelve otro orden.
- No cambiar la semantica de calculo; el orden no debe alterar resultados numericos.
- Mantener controles simples antes de invertir en drag and drop.
- Evitar duplicar logica de reordenacion en varios sitios.

## Siguiente accion

Anadir helper de movimiento de lineas, controles compactos en el editor y test backend de persistencia de `order_index`.
