import type {
  Parameter,
} from "./workspace-model";

export type RawMaterial = {
  id: string;
  code: string | null;
  externalCode: string | null;
  name: string;
  family: string | null;
  isActive: boolean;
  isObsolete: boolean;
  price: number | null;
  parameterValue: number | null;
  parameterCount: number;
  positiveParameterCount: number;
  parameters: Record<string, RawMaterialParameterValue>;
  aliases: string[];
};

export type RawMaterialParameterValue = {
  parameterId: string;
  code: string;
  name: string;
  value: number;
  unit: string | null;
  source: string | null;
  confidence: number | null;
};

export type RawMaterialRead = {
  id: string;
  tenant_id: string;
  code: string | null;
  external_code: string | null;
  name: string;
  normalized_name: string;
  family: string | null;
  subfamily: string | null;
  is_active: boolean;
  is_obsolete: boolean;
  current_price: {
    price: number;
    currency: string;
    unit: string;
    supplier: string | null;
    source: string;
    valid_from: string;
  } | null;
  parameters: Array<{
    parameter_id: string;
    code: string;
    name: string;
    value: number;
    unit: string | null;
    source: string | null;
    confidence: number | null;
  }>;
  aliases: string[];
};

export type RawMaterialCatalogItemRead = {
  id: string;
  tenant_id: string;
  code: string | null;
  external_code: string | null;
  name: string;
  family: string | null;
  subfamily: string | null;
  physical_state: string | null;
  is_active: boolean;
  is_obsolete: boolean;
  current_price: {
    price: number;
    currency: string;
    unit: string;
    supplier: string | null;
    source: string;
    valid_from: string;
  } | null;
  parameter_count: number;
  positive_parameter_count: number;
  aliases: string[];
};

export type RawMaterialCatalogRead = {
  items: RawMaterialCatalogItemRead[];
  total: number;
  limit: number;
  offset: number;
  families: string[];
};

export type RawMaterialAliasRead = {
  id: string;
  tenant_id: string;
  raw_material_id: string;
  alias: string;
  normalized_alias: string;
  source: string;
};

export type MaterialForm = {
  code: string;
  name: string;
  price: string;
  parameterValue: string;
};

export function buildRawMaterialCreatePayload(form: MaterialForm) {
  return {
    code: form.code.trim() || null,
    name: form.name.trim(),
  };
}

export function buildRawMaterialPricePayload(price: number) {
  return { price, currency: "EUR", unit: "kg" };
}

export function buildRawMaterialParameterValuePayload(
  parameter: Parameter,
  value: number,
) {
  return {
    parameter_id: parameter.id,
    value,
  };
}

export function withManualParameterValue(
  material: RawMaterial,
  parameter: Parameter,
  value: number,
): RawMaterial {
  const parameters = {
    ...material.parameters,
    [parameter.code]: {
      parameterId: parameter.id,
      code: parameter.code,
      name: parameter.name,
      value,
      unit: parameter.unit,
      source: "manual",
      confidence: null,
    },
  };
  return {
    ...material,
    parameters,
    positiveParameterCount: Object.values(parameters).filter(
      (item) => Math.abs(item.value) > 0.0001,
    ).length,
  };
}

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
