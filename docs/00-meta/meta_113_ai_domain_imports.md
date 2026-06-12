# Meta 113 - AI domain imports

## Meta

Reducir acoplamiento al barrel global usando el modelo de IA directamente.

## Cambios

- Paneles, acciones y estado de IA importan tipos desde `ai-workflow-model.ts`.
- `draft-review-actions.ts` importa candidatos y plan del modelo de IA.
- `workspace-model.ts` mantiene reexports para compatibilidad, pero deja de ser necesario en estos consumidores.

## Revision

- Alcance sin cambio funcional.
- El dominio de IA queda mas explicito en los imports.
- Se mantiene `formatDateTime` desde `workspace-model.ts` donde corresponde a utilidad global.
