# Especificación funcional - FormulIA Cloud

## 1. Autenticación y SaaS

### Requisitos

- Registro/login de usuarios.
- Creación de tenant/organización.
- Usuarios pueden pertenecer a múltiples tenants.
- Selector de tenant activo.
- Roles por tenant.
- Planes y suscripciones.
- Límites por plan.

### Roles iniciales

- Owner: controla billing, usuarios, configuración y datos.
- Admin: gestiona configuración, materias primas, fórmulas e integraciones.
- Formulador: crea/importa/optimiza fórmulas.
- Viewer: consulta fórmulas y materias primas.
- External Consultant: acceso limitado a proyectos/fórmulas concretas.

## 2. Materias primas

### Funciones

- Crear materia prima.
- Editar materia prima.
- Marcar como activa/obsoleta.
- Gestionar alias.
- Gestionar parámetros técnicos.
- Gestionar precios históricos.
- Asociar documentos.
- Asociar códigos ERP.
- Ver trazabilidad de cambios.

### Campos mínimos

- Código interno.
- Código externo/ERP.
- Nombre.
- Nombre normalizado.
- Familia.
- Subfamilia.
- Estado físico.
- Densidad.
- pH mínimo/máximo.
- Solubilidad.
- Estado activo/obsoleto.
- Notas.

## 3. Parámetros técnicos

Cada tenant puede configurar sus propios parámetros.

Ejemplos:

- Contenido activo.
- Pureza.
- Viscosidad.
- Densidad.
- pH.
- Sólidos totales.
- Humedad.
- Solvente residual.
- Conductividad.
- Punto de inflamación.

Debe soportar:

- Unidad.
- Decimales.
- Familia.
- Descripción.
- Activo/inactivo.

## 4. Fórmulas

### Crear fórmula manual

- Seleccionar materias primas.
- Introducir porcentajes.
- Ordenar materias primas.
- Ver suma total.
- Calcular precio.
- Calcular riqueza.
- Validar que suma 100% o permitir borrador incompleto.
- Guardar versión.

### Biblioteca de fórmulas

- Buscar.
- Filtrar por estado, fecha, usuario, familia, tags.
- Duplicar fórmula.
- Versionar fórmula.
- Comparar fórmulas.
- Exportar a Excel/PDF.

## 5. Importar fórmula desde Excel

El usuario puede subir un Excel con una fórmula existente.

El sistema debe:

- Detectar hoja candidata.
- Detectar columnas de materia prima y porcentaje.
- Permitir mapeo manual de columnas.
- Normalizar nombres.
- Hacer fuzzy matching contra materias primas y alias.
- Mostrar candidatos si no hay coincidencia exacta.
- Permitir crear alias.
- Detectar materias primas obsoletas.
- Calcular coste y riqueza.
- Guardar fórmula.

## 6. Optimización

El sistema debe permitir:

- Minimizar coste.
- Maximizar un parámetro.
- Cumplir mínimos/máximos de parámetros.
- Fijar límites por materia prima.
- Excluir materias primas.
- Obligar materias primas.
- Usar solo materias activas/disponibles.
- Generar varias alternativas.

## 7. IA de formulación

El usuario puede pedir en lenguaje natural una fórmula.

La IA debe:

- Interpretar requisitos.
- Convertirlos a restricciones estructuradas.
- Buscar materias primas candidatas.
- Consultar RAG documental.
- Buscar papers si hace falta.
- Consultar mercado/internet si hace falta.
- Detectar incompatibilidades.
- Ejecutar optimización.
- Calcular resultados.
- Devolver alternativas explicadas.

## 8. RAG documental

- Subida de documentos por tenant.
- Asociación documento-materia prima.
- Ingesta y chunking.
- Embeddings con `tenant_id`.
- Búsqueda semántica.
- Citas a documento, página, sección.

## 9. Integraciones ERP/SAP

- Conector SAP/OData.
- Conector REST genérico.
- Conector CSV/SFTP.
- Staging de datos importados.
- Matching contra materias primas.
- Aplicación controlada de cambios.
- Precios históricos.
- Auditoría.

## 10. Billing

- Planes.
- Suscripciones.
- Stripe Checkout.
- Customer Portal.
- Webhooks.
- Feature flags.
- Límites de uso.

## 11. Revision de formulas con Jira

El usuario puede enviar una formula/version a Jira para revision del laboratorio.

El sistema debe:

- Crear un snapshot inmutable de la version enviada.
- Generar un Excel tecnico desde ese snapshot.
- Crear un ticket en el proyecto Jira configurado.
- Adjuntar el Excel al ticket.
- Guardar issue key, URL, estado y fecha de envio.
- Mostrar el estado Jira dentro de la ficha de formula.
- Sincronizar cambios de estado desde Jira.
- Permitir nueva version si Jira marca cambios solicitados.

El detalle funcional vive en [`../03-domain/jira_formula_review.md`](../03-domain/jira_formula_review.md).
