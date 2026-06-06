# META-030 - Requirement parser MVP

## Decision

La trigesima meta implementable de FormulIA Cloud es anadir un parser MVP de requisitos de formulacion.

Este corte inaugura el carril AI-ready sin depender todavia de un LLM externo: convierte una peticion en lenguaje natural en JSON estructurado mediante reglas deterministas, testeables y transparentes. El objetivo es validar contrato, UI y flujo con el optimizador antes de conectar modelos. La integracion LLM queda fuera hasta decidir credenciales, modelo, logging en `ai_runs` y politica de coste.

## Alcance incluido

- Rama `codex/requirement-parser-mvp`.
- Parser determinista en core para:
  - objetivo `minimize_price`,
  - minimo/maximo de parametro activo,
  - maximo de precio,
  - numero de alternativas,
  - materias obligatorias,
  - materias excluidas,
  - incertidumbres.
- Endpoint API `POST /api/v1/requirements/parse`.
- El endpoint usa tenant context y devuelve JSON tipado.
- UI compacta para introducir una peticion y ver requisitos estructurados.
- Accion para aplicar bounds de parametro al optimizador cuando se reconozcan.
- Tests de parser y API.
- Browser smoke del flujo principal.
- Quality/refactor gate antes de cerrar rama.

## Fuera de alcance

- Llamadas a OpenAI u otro proveedor LLM.
- Persistencia en `ai_runs`.
- Generacion automatica de formula.
- Seleccion automatica de materias candidatas.
- RAG/documentos.
- Compatibilidad tecnica avanzada.
- Multiagente real.

## Criterios de done

1. El parser produce un contrato estructurado estable.
2. No inventa valores no presentes en la peticion.
3. La API exige tenant context igual que el resto de endpoints funcionales.
4. La UI muestra requisitos, incertidumbres y fuente `deterministic`.
5. El usuario puede aplicar min/max del parametro activo al panel optimizador.
6. Tests/checks pasan.
7. Browser smoke verifica parseo y aplicacion de bounds.
8. Quality/refactor gate queda aplicado.
9. Worktree limpio y rama subida.

## Testing minimo

- `python -m pytest`.
- `npm run check`.
- Browser smoke:
  1. crear workspace,
  2. crear parametro,
  3. parsear una peticion con minimo y maximo,
  4. verificar JSON visible,
  5. aplicar bounds al optimizador,
  6. comprobar viewport movil sin overflow.
- `npm audit --audit-level=moderate`.
- `rg` de referencias prohibidas o naming heredado.
- `git diff --check`.

## Riesgos

- No vender heuristicas como IA generativa.
- No conectar LLM sin credenciales y logging decidido.
- No acoplar el parser al frontend.
- Mantener el contrato suficientemente cercano al futuro `RequirementParserAgent`.
- No aplicar automaticamente constraints ambiguas.

## Siguiente accion

Crear modelos core del parser, endpoint API y panel UI pequeno en el editor de formula.
