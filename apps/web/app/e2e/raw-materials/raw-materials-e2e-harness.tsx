"use client";

import { useState } from "react";
import { RawMaterialsPanel } from "../../raw-materials-panel";
import type {
  MaterialForm,
  RawMaterial,
  RawMaterialImportRead,
  RawMaterialPriceRead,
  RawMaterialUpdateForm,
} from "../../raw-material-model";
import type { Parameter } from "../../workspace-base-model";

const parameter: Parameter = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "N",
  name: "Nitrogen",
  unit: "%",
};

const lysineParameter: Parameter = {
  id: "11111111-1111-4111-8111-111111111112",
  code: "LYS",
  name: "Lysine",
  unit: "%",
};

const parameters = [parameter, lysineParameter];

const initialMaterials: RawMaterial[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    detailLoaded: true,
    code: "AA-001",
    externalCode: "SAP-1001",
    name: "Acido humico liquido",
    family: "Organicos",
    subfamily: "Humicos",
    physicalState: "Liquid",
    density: 1.18,
    phMin: 4.2,
    phMax: 5.5,
    solubility: "Soluble",
    notes: "Fixture material with SAP code and price.",
    isActive: true,
    isObsolete: false,
    price: 1.235,
    priceCurrency: "EUR",
    priceUnit: "kg",
    priceSupplier: "SAP Supplier",
    priceSource: "sap",
    priceValidFrom: "2026-06-01",
    parameterValue: 2.4,
    parameterCount: 1,
    positiveParameterCount: 1,
    parameters: {
      N: {
        parameterId: parameter.id,
        code: parameter.code,
        name: parameter.name,
        value: 2.4,
        unit: parameter.unit,
        source: "fixture",
        confidence: null,
      },
    },
    aliases: ["Humic acid liquid"],
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    detailLoaded: true,
    code: "AA-002",
    externalCode: null,
    name: "Extracto vegetal experimental",
    family: "Extractos",
    subfamily: null,
    physicalState: "Liquid",
    density: null,
    phMin: null,
    phMax: null,
    solubility: null,
    notes: "",
    isActive: true,
    isObsolete: false,
    price: null,
    priceCurrency: null,
    priceUnit: null,
    priceSupplier: null,
    priceSource: null,
    priceValidFrom: null,
    parameterValue: null,
    parameterCount: 0,
    positiveParameterCount: 0,
    parameters: {},
    aliases: [],
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    detailLoaded: true,
    code: "AA-003",
    externalCode: "SAP-OLD",
    name: "Materia obsoleta",
    family: "Historico",
    subfamily: null,
    physicalState: "Powder",
    density: null,
    phMin: null,
    phMax: null,
    solubility: null,
    notes: "Deprecated fixture.",
    isActive: false,
    isObsolete: true,
    price: 0.42,
    priceCurrency: "EUR",
    priceUnit: "kg",
    priceSupplier: null,
    priceSource: "manual",
    priceValidFrom: "2025-01-01",
    parameterValue: null,
    parameterCount: 0,
    positiveParameterCount: 0,
    parameters: {},
    aliases: [],
  },
];

const initialPrices: Record<string, RawMaterialPriceRead[]> = {
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": [
    buildPrice("price-1", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", 1.235, "sap", "2026-06-01"),
    buildPrice("price-2", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", 1.1, "manual", "2026-01-01"),
  ],
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [],
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc": [
    buildPrice("price-3", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", 0.42, "manual", "2025-01-01"),
  ],
};

export function RawMaterialsE2EHarness() {
  const [rawMaterials, setRawMaterials] = useState(initialMaterials);
  const [materialForm, setMaterialForm] = useState<MaterialForm>({
    code: "",
    name: "",
    price: "",
    parameterValue: "",
  });
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [pricesByMaterial, setPricesByMaterial] =
    useState<Record<string, RawMaterialPriceRead[]>>(initialPrices);
  const [importStatus, setImportStatus] = useState("idle");

  return (
    <main className="workspace e2eWorkspace">
      <RawMaterialsPanel
        active
        rawMaterials={rawMaterials}
        parameters={parameters}
        materialForm={materialForm}
        aliasInputs={aliasInputs}
        canEditTenantData
        isBusy={false}
        onMaterialFormChange={setMaterialForm}
        onAliasInputsChange={setAliasInputs}
        onCreateMaterial={() => {
          const id = `fixture-${Date.now()}`;
          setRawMaterials((current) => [
            ...current,
            {
              ...initialMaterials[1],
              id,
              detailLoaded: true,
              code: materialForm.code || `RM-${String(current.length + 1).padStart(6, "0")}`,
              name: materialForm.name || "New fixture material",
              price: materialForm.price ? Number(materialForm.price.replace(",", ".")) : null,
            },
          ]);
          setMaterialForm({ code: "", name: "", price: "", parameterValue: "" });
        }}
        onInspectMaterial={() => undefined}
        onAddFormulaLine={() => undefined}
        onCreateAlias={(rawMaterialId) => {
          const alias = aliasInputs[rawMaterialId]?.trim();
          if (!alias) {
            return;
          }
          setRawMaterials((current) =>
            current.map((material) =>
              material.id === rawMaterialId
                ? { ...material, aliases: [...material.aliases, alias] }
                : material,
            ),
          );
          setAliasInputs((current) => ({ ...current, [rawMaterialId]: "" }));
        }}
        onUpdateMaterial={(_rawMaterialId, form) => {
          let updated: RawMaterial | null = null;
          setRawMaterials((current) =>
            current.map((material) => {
              if (material.id !== _rawMaterialId) {
                return material;
              }
              updated = applyUpdateForm(material, form);
              return updated;
            }),
          );
          return updated;
        }}
        onUpdateMaterialParameterValue={(rawMaterialId, parameterToUpdate, value) => {
          let updated: RawMaterial | null = null;
          setRawMaterials((current) =>
            current.map((material) => {
              if (material.id !== rawMaterialId) {
                return material;
              }
              const parametersByCode = {
                ...material.parameters,
                [parameterToUpdate.code]: {
                  parameterId: parameterToUpdate.id,
                  code: parameterToUpdate.code,
                  name: parameterToUpdate.name,
                  value,
                  unit: parameterToUpdate.unit,
                  source: "manual",
                  confidence: null,
                },
              };
              updated = {
                ...material,
                parameters: parametersByCode,
                parameterCount: Object.keys(parametersByCode).length,
                positiveParameterCount: Object.values(parametersByCode).filter(
                  (item) => Math.abs(item.value) > 0.0001,
                ).length,
              };
              return updated;
            }),
          );
          return updated;
        }}
        onLoadMaterialPriceHistory={async (rawMaterialId) => pricesByMaterial[rawMaterialId] ?? []}
        onAddMaterialPrice={async (rawMaterialId, form) => {
          const price = buildPrice(
            `price-${Date.now()}`,
            rawMaterialId,
            Number(form.price.replace(",", ".")),
            form.source || "manual",
            form.validFrom || "2026-06-13",
            form.currency || "EUR",
            form.unit || "kg",
            form.supplier || null,
          );
          const nextHistory = [price, ...(pricesByMaterial[rawMaterialId] ?? [])];
          setPricesByMaterial((current) => ({ ...current, [rawMaterialId]: nextHistory }));
          setRawMaterials((current) =>
            current.map((material) =>
              material.id === rawMaterialId
                ? {
                    ...material,
                    price: price.price,
                    priceCurrency: price.currency,
                    priceUnit: price.unit,
                    priceSupplier: price.supplier,
                    priceSource: price.source,
                    priceValidFrom: price.valid_from,
                  }
                : material,
            ),
          );
          return nextHistory;
        }}
        onPreviewSapImport={async (_file, form) => {
          setImportStatus(`preview:${form.source}`);
          return buildImportPreview("preview");
        }}
        onApplySapImport={async () => {
          setImportStatus("applied");
          setRawMaterials((current) =>
            current.map((material) =>
              material.id === "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
                ? {
                    ...material,
                    externalCode: "SAP-2002",
                    price: 0.95,
                    priceCurrency: "EUR",
                    priceUnit: "kg",
                    priceSource: "sap",
                    priceValidFrom: "2026-06-13",
                  }
                : material,
            ),
          );
          return buildImportPreview("applied");
        }}
      />
      <output aria-label="E2E import status" hidden>
        {importStatus}
      </output>
    </main>
  );
}

function applyUpdateForm(material: RawMaterial, form: RawMaterialUpdateForm): RawMaterial {
  return {
    ...material,
    detailLoaded: true,
    code: form.code || null,
    externalCode: form.externalCode || null,
    name: form.name,
    family: form.family || null,
    subfamily: form.subfamily || null,
    physicalState: form.physicalState || null,
    density: form.density ? Number(form.density.replace(",", ".")) : null,
    phMin: form.phMin ? Number(form.phMin.replace(",", ".")) : null,
    phMax: form.phMax ? Number(form.phMax.replace(",", ".")) : null,
    solubility: form.solubility || null,
    notes: form.notes,
    isActive: form.isObsolete ? false : form.isActive,
    isObsolete: form.isObsolete,
  };
}

function buildPrice(
  id: string,
  rawMaterialId: string,
  price: number,
  source: string,
  validFrom: string,
  currency = "EUR",
  unit = "kg",
  supplier: string | null = null,
): RawMaterialPriceRead {
  return {
    id,
    tenant_id: "22222222-2222-4222-8222-222222222222",
    raw_material_id: rawMaterialId,
    price,
    currency,
    unit,
    supplier,
    source,
    valid_from: validFrom,
    valid_to: null,
    created_at: `${validFrom}T00:00:00Z`,
  };
}

function buildImportPreview(status: RawMaterialImportRead["status"]): RawMaterialImportRead {
  return {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    tenant_id: "22222222-2222-4222-8222-222222222222",
    file_name: "sap_fixture.xlsx",
    source: "sap",
    source_hash: "fixture-hash",
    status,
    created_at: "2026-06-13T00:00:00Z",
    summary_json: {
      new_material: 1,
      price_update: 1,
      metadata_update: 1,
      unchanged: 1,
      needs_review: 1,
      error: 0,
    },
    rows: [
      {
        id: "row-1",
        tenant_id: "22222222-2222-4222-8222-222222222222",
        import_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        row_number: 2,
        raw_material_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        raw_name: "Extracto vegetal experimental",
        action: "price_update",
        status: status === "applied" ? "applied" : "ready",
        message: "Price update detected.",
        raw_row_json: {
          parsed: {
            name: "Extracto vegetal experimental",
            code: "AA-002",
            external_code: "SAP-2002",
            price: 0.95,
            currency: "EUR",
            unit: "kg",
            supplier: "SAP Supplier",
            family: "Extractos",
            sap_status: "active",
          },
        },
      },
      {
        id: "row-2",
        tenant_id: "22222222-2222-4222-8222-222222222222",
        import_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        row_number: 3,
        raw_material_id: null,
        raw_name: "Materia SAP nueva",
        action: "new_material",
        status: status === "applied" ? "applied" : "ready",
        message: "New material detected.",
        raw_row_json: {
          parsed: {
            name: "Materia SAP nueva",
            code: "AA-004",
            external_code: "SAP-4004",
            price: 1.75,
            currency: "EUR",
            unit: "kg",
            supplier: "SAP Supplier",
            family: "Nuevas",
            sap_status: "active",
          },
        },
      },
      {
        id: "row-3",
        tenant_id: "22222222-2222-4222-8222-222222222222",
        import_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        row_number: 4,
        raw_material_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        raw_name: "Acido humico liquido",
        action: "needs_review",
        status: "needs_review",
        message: "Fuzzy match needs review.",
        raw_row_json: {
          parsed: {
            name: "Acido humico",
            external_code: "SAP-1001-X",
            price: 1.24,
            currency: "EUR",
            unit: "kg",
          },
        },
      },
    ],
  };
}
