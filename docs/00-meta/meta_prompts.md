# Modo meta - prompts y base de trabajo

Este documento es la base operativa para planificar, decidir y construir FormulIA Cloud sin perder el foco. Debe leerse antes de arrancar una iteracion de arquitectura, backlog o implementacion.

## Objetivo del modo meta

Convertir la vision de producto en una app ejecutable por cortes pequenos, con decisiones explicitas y sin reabrir lo ya cerrado salvo que exista una razon tecnica o comercial fuerte.

El modo meta no es documentacion infinita. Termina cuando produce:

1. Una decision clara.
2. Un alcance de trabajo pequeno.
3. Un criterio de validacion.
4. Un siguiente cambio implementable.

## Decisiones congeladas

- Producto: FormulIA.
- SaaS comercial: FormulIA Cloud.
- Nombre tecnico interno: FormulIA Platform.
- Tagline ES: Formulacion tecnica asistida por IA.
- Tagline EN: AI-powered formulation intelligence.
- Posicionamiento: plataforma generica de formulacion tecnica, no sectorial.
- No usar referencias a empresa, marca o sector original ni ejemplos sectoriales heredados.
- SaaS multi-tenant desde el primer commit.
- `tenant_id` obligatorio en toda tabla funcional salvo tablas globales explicitas.
- La IA asiste, interpreta y explica, pero no sustituye calculo, optimizacion ni validacion determinista.
- Ninguna formula propuesta por IA se considera final sin pasar por tools deterministas y confirmacion humana.
- El core inicial es materias primas, parametros, formulas, calculo, precios, importacion Excel, optimizacion e IA controlada.
- No empezar por chatbot generalista, landing comercial ni redisenos visuales amplios.
- La primera app debe ser una vertical slice usable, no una demo estetica.

## Stack congelado para el primer corte

- Monorepo.
- Frontend: Next.js, TypeScript, Tailwind, shadcn/ui, TanStack Query/Table.
- Backend: FastAPI, Pydantic, SQLAlchemy/SQLModel, Alembic.
- DB: Postgres/Supabase.
- Storage: Supabase Storage o S3-compatible.
- Queue futura: Celery, RQ o Arq con Redis.
- IA futura: agentes con tools deterministas, RAG por tenant y logs de ejecucion.
- Billing: Stripe, primero como skeleton y despues enforcement completo.
- ERP: Integration Hub con CSV/REST primero y SAP/OData como skeleton.

## Estructura objetivo del repo

```text
apps/
  web/
  api/
packages/
  core/
  shared/
infra/
  db/
docs/
```

## Primera vertical slice congelada

La primera version funcional debe permitir:

1. Crear o simular tenant activo.
2. Crear materias primas.
3. Crear parametros tecnicos configurables.
4. Asignar valores de parametros y precio a materias primas.
5. Crear una formula manual con porcentajes.
6. Calcular coste y composicion tecnica.
7. Guardar formula y resultado.
8. Ver una UI basica para materias primas, parametros y formulas.
9. Probar aislamiento de tenant al menos a nivel backend.

No incluir en esta slice:

- Chat IA.
- RAG.
- importador Excel completo.
- Optimizador avanzado.
- Billing real.
- ERP real.
- Landing comercial.

## Cosas adaptables

Estas decisiones pueden cambiar, pero solo registrando motivo en `docs/05-delivery/decisions.md`:

- SQLModel vs SQLAlchemy puro.
- Supabase Auth vs auth propia inicial.
- pnpm vs npm.
- shadcn/ui completo vs componentes propios ligeros.
- Monorepo con workspaces npm/pnpm vs estructura simple temporal.
- Queue concreta.
- Proveedor LLM.
- Proveedor de embeddings.
- Primer vertical comercial despues del core generico.

## Prompt 1 - Arranque meta

Usar cuando se quiera convertir una idea grande en trabajo ejecutable.

```text
Actua como arquitecto de producto y tech lead de FormulIA Cloud.

Lee primero docs/00-meta/meta_prompts.md, docs/01-product/product_brief.md, docs/01-product/specs.md, docs/02-architecture/architecture.md, docs/02-architecture/data_model.md, docs/05-delivery/roadmap.md y docs/05-delivery/backlog.md.

Objetivo: transformar la siguiente idea en un plan de trabajo pequeno, implementable y verificable.

Idea:
<pegar idea>

Devuelve:
1. Que decision hay que tomar.
2. Que queda dentro y fuera.
3. Que archivos de docs hay que actualizar.
4. Que codigo se tocaria despues.
5. Criterios de done.
6. Riesgos o preguntas bloqueantes, solo si son realmente bloqueantes.
```

## Prompt 2 - Guardian de alcance

Usar antes de aceptar features nuevas o cambios de direccion.

```text
Actua como guardian de alcance de FormulIA Cloud.

Compara esta peticion con las decisiones congeladas en docs/00-meta/meta_prompts.md y el backlog actual.

Peticion:
<pegar peticion>

Clasifica la peticion como:
- hacer ahora,
- documentar para despues,
- rechazar por desalineada,
- requiere decision previa.

Explica brevemente:
1. Impacto en la primera vertical slice.
2. Riesgo de distraer el core.
3. Documento o ADR que debe actualizarse.
4. Siguiente accion recomendada.
```

## Prompt 3 - Arquitectura antes de codigo

Usar justo antes de crear o modificar estructura tecnica importante.

```text
Actua como arquitecto backend/frontend senior de FormulIA Platform.

Partiendo de la documentacion actual, diseña el cambio tecnico minimo para:
<objetivo>

Respeta:
- SaaS multi-tenant desde el primer commit.
- Separacion dominio, infraestructura, API y UI.
- Calculo determinista como fuente de verdad.
- Sin IA final hasta tener core probado.

Devuelve:
1. Estructura de carpetas afectada.
2. Modelos/tablas necesarios.
3. Endpoints necesarios.
4. Componentes UI necesarios.
5. Tests minimos.
6. Secuencia de commits sugerida.
```

## Prompt 4 - Vertical slice

Usar para partir trabajo grande en una entrega end-to-end.

```text
Actua como tech lead de entrega.

Define una vertical slice end-to-end para:
<capacidad>

Debe incluir:
1. Caso de usuario.
2. Modelo de datos minimo.
3. API minima.
4. UI minima.
5. Logica de dominio.
6. Tests.
7. Datos seed o fixtures.
8. Criterio de demo local.

Deja fuera todo lo que no sea imprescindible para validar la capacidad.
```

## Prompt 5 - Implementacion guiada

Usar cuando ya se va a tocar codigo.

```text
Actua como implementador senior en el repo de FormulIA Cloud.

Antes de editar, revisa la documentacion relevante y el estado actual del repo.

Implementa:
<tarea concreta>

Reglas:
- Mantener cambios pequenos y coherentes.
- No introducir abstracciones prematuras.
- No romper decisiones congeladas.
- Añadir tests si el cambio toca dominio, API o aislamiento multi-tenant.
- Verificar con comandos locales.

Al final informa:
1. Archivos modificados.
2. Comportamiento logrado.
3. Verificacion ejecutada.
4. Riesgo restante.
```

## Prompt 6 - Revision de coherencia

Usar despues de editar docs o codigo.

```text
Actua como revisor de coherencia de FormulIA Cloud.

Revisa los cambios recientes contra:
- docs/00-meta/meta_prompts.md
- docs/01-product/product_brief.md
- docs/02-architecture/data_model.md
- docs/05-delivery/decisions.md
- docs/05-delivery/backlog.md

Busca:
1. Contradicciones.
2. Referencias antiguas de naming o sector.
3. Riesgos multi-tenant.
4. IA usada antes del core determinista.
5. Trabajo que deba moverse a backlog futuro.

Devuelve findings concretos con archivo y recomendacion.
```

## Prompt 7 - ADR rapido

Usar cuando haya que congelar una decision nueva.

```text
Necesito registrar una decision para FormulIA Cloud.

Contexto:
<contexto>

Decision propuesta:
<decision>

Alternativas consideradas:
<alternativas>

Genera una entrada ADR breve para docs/05-delivery/decisions.md con:
- titulo,
- decision,
- motivo,
- consecuencias,
- que revisar mas adelante.
```

## Prompt 8 - Preparar siguiente sesion

Usar al cerrar una sesion de trabajo larga.

```text
Resume el estado actual de FormulIA Cloud para retomar trabajo despues.

Incluye:
1. Que quedo decidido.
2. Que archivos cambiaron.
3. Que esta a medias.
4. Siguiente tarea recomendada.
5. Comandos utiles para verificar.
6. Riesgos o preguntas abiertas.

No repitas documentacion completa. Deja una nota operativa breve.
```

## Base de trabajo inmediata

El siguiente bloque de trabajo recomendado es:

1. Validar y ajustar `docs/02-architecture/architecture.md` al monorepo objetivo.
2. Validar `docs/02-architecture/data_model.md` contra la primera vertical slice.
3. Ajustar `docs/02-architecture/api_spec.md` a endpoints estrictamente MVP.
4. Crear scaffold del monorepo.
5. Implementar backend minimo con tenant, materias primas, parametros, formulas y calculo.
6. Añadir tests de calculo y aislamiento tenant.
7. Implementar UI operativa minima.

## Recordatorio para cualquier agente

- Si dudas entre planificar mas o construir una slice pequena, construye la slice pequena.
- Si una idea no cabe en la primera vertical, muévela a backlog.
- Si contradice decisiones congeladas, crea ADR antes de implementarla.
- Si afecta a formulas, primero dominio determinista; despues API; despues UI; IA al final.
- Si toca datos de tenant, prueba aislamiento.
