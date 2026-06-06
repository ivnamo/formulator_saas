# Memory - contexto persistente para agentes

Este documento define qué debe recordar la IA y qué no debe recordar.

## Memoria global del producto

- FormulIA Cloud es SaaS multi-tenant.
- Debe servir para múltiples empresas y sectores.
- El módulo Calidad de la app antigua no se usa.
- El core relevante es materias primas + fórmulas + cálculo + optimización + importación + IA.
- La IA no debe inventar fórmulas sin cálculo determinista.
- Toda fórmula debe tener trazabilidad.

## Memoria por tenant

Cada tenant tiene sus propios datos:

- materias primas,
- alias,
- parámetros,
- precios,
- fórmulas,
- documentos,
- reglas de compatibilidad,
- preferencias,
- plantillas,
- conectores ERP,
- historial de IA.

No mezclar información entre tenants.

## Memoria por usuario

Puede recordar:

- preferencias de UI,
- último tenant usado,
- formatos Excel frecuentes,
- filtros habituales,
- unidades preferidas.

No recordar:

- secretos,
- passwords,
- credenciales ERP,
- información sensible fuera de la base autorizada.

## Memoria de formulación

El sistema puede aprender:

- alias confirmados de materias primas,
- equivalencias de columnas Excel,
- reglas validadas,
- preferencias de optimización,
- sustitutos aprobados,
- materias primas favoritas.

Toda memoria aprendida debe ser revisable/editable por el tenant.

## Memoria de IA

Guardar en `ai_runs`:

- petición original,
- interpretación estructurada,
- tools usadas,
- evidencias,
- fórmulas propuestas,
- validaciones,
- errores,
- tokens/coste si disponible.

El parser determinista de requisitos tambien se registra en `ai_runs` con `provider=deterministic` y `model=rules:v1`. Cuando se conecte un LLM real, cada llamada debera conservar el mismo contrato y anadir tokens/coste si el proveedor lo devuelve.

## Reglas anti-contaminación

- Nunca usar documentos de otro tenant.
- Nunca usar alias de otro tenant como si fueran propios.
- Nunca usar precios de otro tenant.
- Las fuentes de mercado pueden ser globales, pero deben marcarse como externas.
- Los papers pueden ser globales, pero su incorporación al RAG debe ser por tenant.
