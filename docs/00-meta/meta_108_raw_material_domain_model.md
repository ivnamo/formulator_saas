# Meta 108 - Raw material domain model

## Meta

Separar los contratos de materias primas del modelo global del workspace.

## Cambios

- `raw-material-model.ts` pasa a contener tipos de materia prima, catalogo, alias y formulario.
- `workspace-model.ts` mantiene reexports para no romper imports actuales.
- `WorkspaceState` conserva la referencia a `RawMaterial` como parte del estado editable.

## Revision

- Alcance sin cambio funcional.
- El modulo de materias primas queda mas autocontenido junto a sus helpers de conversion y merge.
- `workspace-model.ts` reduce dependencia de detalles de catalogo y API de materias primas.
