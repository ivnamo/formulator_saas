import type {
  Parameter,
  RawMaterial,
  RawMaterialCatalogItemRead,
  RawMaterialParameterValue,
  RawMaterialRead,
} from "./workspace-model";

export function toWorkspaceRawMaterial(
  material: RawMaterialRead,
  values: { price?: number | null; parameterValue?: number | null } = {},
  activeParameters: Parameter[] = [],
): RawMaterial {
  const parameterMap = new Map<string, RawMaterialParameterValue>();
  for (const parameter of material.parameters) {
    parameterMap.set(parameter.code, {
      parameterId: parameter.parameter_id,
      code: parameter.code,
      name: parameter.name,
      value: parameter.value,
      unit: parameter.unit,
      source: parameter.source,
      confidence: parameter.confidence,
    });
  }
  for (const parameter of activeParameters) {
    if (!parameterMap.has(parameter.code)) {
      parameterMap.set(parameter.code, {
        parameterId: parameter.id,
        code: parameter.code,
        name: parameter.name,
        value: 0,
        unit: parameter.unit,
        source: null,
        confidence: null,
      });
    }
  }
  const parameters = Object.fromEntries(parameterMap);

  return {
    id: material.id,
    code: material.code,
    externalCode: material.external_code,
    name: material.name,
    family: material.family,
    isActive: material.is_active,
    isObsolete: material.is_obsolete,
    price: values.price ?? material.current_price?.price ?? null,
    parameterValue: values.parameterValue ?? null,
    parameterCount: parameterMap.size,
    positiveParameterCount: Array.from(parameterMap.values()).filter(
      (parameter) => Math.abs(parameter.value) > 0.0001,
    ).length,
    parameters,
    aliases: material.aliases,
  };
}

export function toWorkspaceRawMaterialCatalogItem(
  material: RawMaterialCatalogItemRead,
): RawMaterial {
  return {
    id: material.id,
    code: material.code,
    externalCode: material.external_code,
    name: material.name,
    family: material.family,
    isActive: material.is_active,
    isObsolete: material.is_obsolete,
    price: material.current_price?.price ?? null,
    parameterValue: null,
    parameterCount: material.parameter_count,
    positiveParameterCount: material.positive_parameter_count,
    parameters: {},
    aliases: material.aliases,
  };
}

export function mergeRawMaterials(
  current: RawMaterial[],
  incoming: RawMaterial[],
): RawMaterial[] {
  const next = new Map(current.map((material) => [material.id, material]));
  for (const material of incoming) {
    const existing = next.get(material.id);
    next.set(material.id, {
      ...existing,
      ...material,
      parameters:
        Object.keys(material.parameters).length > 0
          ? material.parameters
          : (existing?.parameters ?? material.parameters),
      aliases:
        material.aliases.length > 0 || !existing ? material.aliases : existing.aliases,
    });
  }
  return Array.from(next.values());
}

export function withRawMaterialAlias(
  rawMaterials: RawMaterial[],
  rawMaterialId: string,
  alias: string,
): RawMaterial[] {
  return rawMaterials.map((material) =>
    material.id === rawMaterialId && !material.aliases.includes(alias)
      ? { ...material, aliases: [...material.aliases, alias] }
      : material,
  );
}
