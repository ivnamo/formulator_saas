# Decisiones arquitectónicas iniciales

## ADR-001: Reconstrucción completa, no refactor Streamlit

Decisión: rehacer como SaaS web con frontend y backend separados.

Motivo: Streamlit limita UX, SaaS, multi-tenant, pagos, ERP e IA avanzada.

## ADR-002: Multi-tenant desde el primer commit

Decisión: `tenant_id` obligatorio en tablas funcionales.

Motivo: vender como SaaS es mandatory.

## ADR-003: IA como orquestador, no calculadora final

Decisión: la IA debe usar tools deterministas para cálculo/optimización.

Motivo: evitar alucinaciones técnicas.

## ADR-004: Precios históricos

Decisión: no guardar un único precio mutable como verdad completa.

Motivo: ERP, auditoría y recalculo histórico.

## ADR-005: ERP con staging

Decisión: no aplicar cambios ERP directamente.

Motivo: evitar que errores de integración rompan datos críticos.

## ADR-006: Parámetros configurables por tenant

Decisión: normalizar parámetros en tablas, no columnas fijas.

Motivo: flexibilidad para diferentes empresas/sectores.

## ADR-007: RAG aislado por tenant

Decisión: documentos y embeddings siempre filtran tenant.

Motivo: seguridad y confidencialidad.

## ADR-008: Importador Excel como feature principal

Decisión: implementar temprano.

Motivo: caso de uso real y alto valor: calcular riqueza/precio de fórmulas existentes.

## ADR-009: Naming del producto

Decisión: usar FormulIA como nombre de producto, FormulIA Cloud como nombre comercial del SaaS y FormulIA Platform como nombre técnico interno.

Motivo: posicionar el producto como una plataforma de formulación asistida por IA, con una marca más comercial que el nombre provisional anterior.

Taglines:

- ES: Formulación técnica asistida por IA.
- EN: AI-powered formulation intelligence.

## ADR-010: Modo meta como base de trabajo

Decisión: usar `docs/00-meta/meta_prompts.md` como documento previo para planificar metas, congelar decisiones y partir el trabajo en vertical slices pequeñas.

Motivo: evitar que la construcción de FormulIA Cloud derive en planificación infinita, cambios de alcance poco visibles o decisiones olvidadas entre sesiones.

Consecuencias:

- Cualquier cambio de dirección relevante debe compararse contra las decisiones congeladas.
- Las decisiones nuevas se registran como ADR.
- La primera implementación debe priorizar la vertical slice de tenant, materias primas, parámetros, fórmulas y cálculo determinista.
