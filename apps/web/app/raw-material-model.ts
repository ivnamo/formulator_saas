import type { Parameter } from "./workspace-base-model";
import { sortByParameterCode } from "./parameter-order";

export type RawMaterial = {
  id: string;
  detailLoaded: boolean;
  code: string | null;
  externalCode: string | null;
  name: string;
  family: string | null;
  subfamily: string | null;
  physicalState: string | null;
  density: number | null;
  phMin: number | null;
  phMax: number | null;
  solubility: string | null;
  notes: string | null;
  isActive: boolean;
  isObsolete: boolean;
  price: number | null;
  priceCurrency: string | null;
  priceUnit: string | null;
  priceSupplier: string | null;
  priceSource: string | null;
  priceValidFrom: string | null;
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
  physical_state: string | null;
  density: number | null;
  ph_min: number | null;
  ph_max: number | null;
  solubility: string | null;
  notes: string | null;
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

export type RawMaterialPriceRead = {
  id: string;
  tenant_id: string;
  raw_material_id: string;
  price: number;
  currency: string;
  unit: string;
  supplier: string | null;
  source: string;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
};

export type RawMaterialImportRowRead = {
  id: string;
  tenant_id: string;
  import_id: string;
  row_number: number;
  raw_material_id: string | null;
  raw_name: string | null;
  action: string;
  status: string;
  raw_row_json: {
    parsed?: {
      name?: string | null;
      code?: string | null;
      external_code?: string | null;
      price?: number | null;
      currency?: string | null;
      unit?: string | null;
      supplier?: string | null;
      family?: string | null;
      sap_status?: string | null;
    };
    diff?: Record<string, unknown>;
    match?: {
      type?: string | null;
      score?: number | null;
      message?: string | null;
      raw_material_id?: string | null;
    };
    raw?: Record<string, unknown>;
  };
  message: string | null;
};

export type RawMaterialImportRead = {
  id: string;
  tenant_id: string;
  file_name: string;
  source: string;
  source_hash: string;
  status: string;
  summary_json: Record<string, number | string | null>;
  created_at: string;
  rows: RawMaterialImportRowRead[];
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

export type RawMaterialUpdateForm = {
  code: string;
  externalCode: string;
  name: string;
  family: string;
  subfamily: string;
  physicalState: string;
  density: string;
  phMin: string;
  phMax: string;
  solubility: string;
  notes: string;
  isActive: boolean;
  isObsolete: boolean;
};

export type RawMaterialPriceForm = {
  price: string;
  currency: string;
  unit: string;
  supplier: string;
  source: string;
  validFrom: string;
};

export type SapRawMaterialImportForm = {
  source: string;
  sheetName: string;
  validFrom: string;
};

export function buildRawMaterialCreatePayload(form: MaterialForm) {
  return {
    code: form.code.trim() || null,
    name: form.name.trim(),
  };
}

export function buildRawMaterialUpdateForm(material: RawMaterial): RawMaterialUpdateForm {
  return {
    code: material.code ?? "",
    externalCode: material.externalCode ?? "",
    name: material.name,
    family: material.family ?? "",
    subfamily: material.subfamily ?? "",
    physicalState: material.physicalState ?? "",
    density: material.density === null ? "" : String(material.density),
    phMin: material.phMin === null ? "" : String(material.phMin),
    phMax: material.phMax === null ? "" : String(material.phMax),
    solubility: material.solubility ?? "",
    notes: material.notes ?? "",
    isActive: material.isActive,
    isObsolete: material.isObsolete,
  };
}

export function buildRawMaterialUpdatePayload(form: RawMaterialUpdateForm) {
  return {
    code: form.code.trim() || null,
    external_code: form.externalCode.trim() || null,
    name: form.name.trim(),
    family: form.family.trim() || null,
    subfamily: form.subfamily.trim() || null,
    physical_state: form.physicalState.trim() || null,
    density: parseFormNumber(form.density),
    ph_min: parseFormNumber(form.phMin),
    ph_max: parseFormNumber(form.phMax),
    solubility: form.solubility.trim() || null,
    notes: form.notes.trim() || null,
    is_active: form.isObsolete ? false : form.isActive,
    is_obsolete: form.isObsolete,
  };
}

export function buildRawMaterialPricePayload(priceForm: RawMaterialPriceForm) {
  return {
    price: Number(priceForm.price.replace(",", ".")),
    currency: priceForm.currency.trim() || "EUR",
    unit: priceForm.unit.trim() || "kg",
    supplier: priceForm.supplier.trim() || null,
    source: priceForm.source.trim() || "manual",
    valid_from: priceForm.validFrom || null,
  };
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
  const parameters = Object.fromEntries(
    sortByParameterCode(
      [
        ...Object.values(material.parameters).filter((item) => item.code !== parameter.code),
        {
          parameterId: parameter.id,
          code: parameter.code,
          name: parameter.name,
          value,
          unit: parameter.unit,
          source: "manual",
          confidence: null,
        },
      ],
      (item) => item.code,
    ).map((item) => [item.code, item]),
  );
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
  const parameters = Object.fromEntries(
    sortByParameterCode(Array.from(parameterMap.values()), (parameter) => parameter.code).map(
      (parameter) => [parameter.code, parameter],
    ),
  );

  return {
    id: material.id,
    detailLoaded: true,
    code: material.code,
    externalCode: material.external_code,
    name: material.name,
    family: material.family,
    subfamily: material.subfamily,
    physicalState: material.physical_state,
    density: material.density,
    phMin: material.ph_min,
    phMax: material.ph_max,
    solubility: material.solubility,
    notes: material.notes,
    isActive: material.is_active,
    isObsolete: material.is_obsolete,
    price: values.price ?? material.current_price?.price ?? null,
    priceCurrency: material.current_price?.currency ?? null,
    priceUnit: material.current_price?.unit ?? null,
    priceSupplier: material.current_price?.supplier ?? null,
    priceSource: material.current_price?.source ?? null,
    priceValidFrom: material.current_price?.valid_from ?? null,
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
    detailLoaded: false,
    code: material.code,
    externalCode: material.external_code,
    name: material.name,
    family: material.family,
    subfamily: material.subfamily,
    physicalState: material.physical_state,
    density: null,
    phMin: null,
    phMax: null,
    solubility: null,
    notes: null,
    isActive: material.is_active,
    isObsolete: material.is_obsolete,
    price: material.current_price?.price ?? null,
    priceCurrency: material.current_price?.currency ?? null,
    priceUnit: material.current_price?.unit ?? null,
    priceSupplier: material.current_price?.supplier ?? null,
    priceSource: material.current_price?.source ?? null,
    priceValidFrom: material.current_price?.valid_from ?? null,
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
    const useIncomingDetail = material.detailLoaded || !existing;
    next.set(material.id, {
      ...existing,
      ...material,
      detailLoaded: material.detailLoaded || existing?.detailLoaded || false,
      parameters:
        Object.keys(material.parameters).length > 0
          ? material.parameters
          : (existing?.parameters ?? material.parameters),
      density: useIncomingDetail ? material.density : (existing?.density ?? material.density),
      phMin: useIncomingDetail ? material.phMin : (existing?.phMin ?? material.phMin),
      phMax: useIncomingDetail ? material.phMax : (existing?.phMax ?? material.phMax),
      solubility: useIncomingDetail
        ? material.solubility
        : (existing?.solubility ?? material.solubility),
      notes: useIncomingDetail ? material.notes : (existing?.notes ?? material.notes),
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

function parseFormNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
