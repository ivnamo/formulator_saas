# META-002 - Workspace editor

## Decision

La segunda meta implementable de FormulIA Cloud es transformar la foundation slice en un workspace editable. El usuario debe poder trabajar sin depender de datos demo fijos: crear materias primas, parametros, precios, valores tecnicos y formulas manuales desde la UI.

Esta meta sigue siendo core determinista sin IA. Su objetivo es validar que FormulIA Platform ya puede operar un caso manual basico end-to-end con tenant context y calculo persistido.

## Alcance incluido

- Rama `feature/workspace-editor`.
- UI operativa para crear materias primas.
- UI operativa para crear parametros tecnicos.
- UI para asignar precio y valor de parametro a materias primas.
- Editor manual de formula con alta, baja y edicion de porcentajes.
- Calculo backend desde la formula editada.
- Resultado visible con coste, composicion tecnica, porcentaje total y warnings.
- Estado de workspace claro: tenant activo, datos cargados, formula seleccionada y errores.
- Tests proporcionales para API/core si se toca logica compartida.
- Smoke test web local del flujo principal.
- Quality/refactor gate antes de cerrar la rama.

## Fuera de alcance

- Auth real.
- Multiusuario completo.
- Importador Excel.
- Optimizador.
- IA, RAG o agentes.
- Billing.
- ERP.
- Exportacion Excel/PDF.
- Permisos granulares.
- Redisenos visuales amplios.

## Documentos fuente

- `docs/00-meta/meta_prompts.md`
- `docs/00-meta/meta_001_foundation_slice.md`
- `docs/01-product/specs.md`
- `docs/01-product/frontend_ux.md`
- `docs/02-architecture/api_spec.md`
- `docs/05-delivery/testing.md`
- `docs/05-delivery/backlog.md`

## Codigo que se tocara

```text
apps/web/app/page.tsx
apps/web/app/globals.css
apps/api/src/formulia_api/
apps/api/tests/
packages/core/
```

El backend y core solo se tocaran si la UI necesita un contrato que no exista o si se detecta deuda directa dentro del alcance.

## Criterios de done

1. Un usuario puede crear un tenant/workspace activo desde UI.
2. Puede crear al menos dos materias primas manualmente.
3. Puede crear al menos un parametro tecnico manualmente.
4. Puede asignar precio y valor tecnico a cada materia prima.
5. Puede crear o actualizar una formula manual con porcentajes editables.
6. Puede eliminar una linea de formula antes de calcular.
7. El backend calcula coste y composicion de la formula guardada.
8. La UI muestra warnings cuando el total no es 100 o falta precio/parametro.
9. Los cambios respetan tenant context.
10. Tests/checks pasan.
11. Quality/refactor gate queda aplicado y documentado en el cierre.
12. Worktree limpio y rama subida.

## Secuencia de commits sugerida

1. `Define workspace editor meta`
2. `Add workspace editor state model`
3. `Add material and parameter forms`
4. `Add formula item editor`
5. `Add calculation workflow checks`
6. `Refactor workspace editor`
7. `Document workspace editor workflow`

## Testing minimo

- `python -m pytest` para core/API si se toca backend o contratos.
- `npm run check` para TypeScript/build web.
- Smoke local con API y web:
  1. crear workspace,
  2. crear parametro,
  3. crear dos materias con precio y valor,
  4. editar formula,
  5. calcular,
  6. comprobar coste/composicion/warnings.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- La pagina `page.tsx` puede crecer demasiado; si ocurre, refactorizar dentro de la rama en componentes o helpers locales.
- No convertir el editor en un ERP ni en una tabla avanzada todavia.
- Evitar abstracciones para importador Excel antes de necesitarlo.
- Mantener dominio de calculo fuera de la UI.

## Siguiente accion

Revisar contratos existentes de API y decidir si el editor puede construirse solo con endpoints actuales. Si falta algun endpoint minimo, anadirlo con test antes de ampliar la UI.
