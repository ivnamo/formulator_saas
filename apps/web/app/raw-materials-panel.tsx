import { Plus, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { MaterialForm, RawMaterial, WorkspaceState } from "./workspace-model";

type RawMaterialsPanelProps = {
  active: boolean;
  rawMaterials: RawMaterial[];
  parameter: WorkspaceState["parameter"];
  materialForm: MaterialForm;
  aliasInputs: Record<string, string>;
  canEditTenantData: boolean;
  isBusy: boolean;
  onMaterialFormChange: Dispatch<SetStateAction<MaterialForm>>;
  onAliasInputsChange: Dispatch<SetStateAction<Record<string, string>>>;
  onCreateMaterial: () => void | Promise<void>;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
  onCreateAlias: (rawMaterialId: string) => void | Promise<void>;
};

export function RawMaterialsPanel({
  active,
  rawMaterials,
  parameter,
  materialForm,
  aliasInputs,
  canEditTenantData,
  isBusy,
  onMaterialFormChange,
  onAliasInputsChange,
  onCreateMaterial,
  onAddFormulaLine,
  onCreateAlias,
}: RawMaterialsPanelProps) {
  return (
    <section id="materials" className="panel materialPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Raw materials</h2>
        <span>{rawMaterials.length} rows</span>
      </div>
      <div className="materialForm">
        <label>
          <span>Code</span>
          <input
            value={materialForm.code}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, code: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Name</span>
          <input
            value={materialForm.name}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, name: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Price EUR/kg</span>
          <input
            inputMode="decimal"
            value={materialForm.price}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, price: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>{parameter ? parameter.name : "Value"}</span>
          <input
            inputMode="decimal"
            value={materialForm.parameterValue}
            onChange={(event) =>
              onMaterialFormChange((current) => ({
                ...current,
                parameterValue: event.target.value,
              }))
            }
            disabled={!canEditTenantData || !parameter}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateMaterial()}
          disabled={!canEditTenantData}
        >
          <Plus size={17} />
          Add material
        </button>
      </div>
      <div className="materialTable">
        <div className="materialHead">
          <span>Code</span>
          <span>Name</span>
          <span>Price</span>
          <span>{parameter?.code ?? "Parameter"}</span>
          <span>Formula</span>
        </div>
        {rawMaterials.length === 0 ? (
          <div className="empty">No raw materials yet.</div>
        ) : (
          rawMaterials.map((material) => (
            <div className="materialRowWrap" key={material.id}>
              <div className="materialRow">
                <code>{material.code || "-"}</code>
                <span>{material.name}</span>
                <span>{material.price === null ? "-" : material.price.toFixed(2)}</span>
                <span>
                  {material.parameterValue === null
                    ? "-"
                    : material.parameterValue.toFixed(2)}
                </span>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => void onAddFormulaLine(material.id)}
                  disabled={isBusy}
                  title="Add to formula"
                  aria-label={`Add ${material.name} to formula`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="aliasEditor">
                <span>Aliases</span>
                <div className="aliasTags">
                  {material.aliases.length ? (
                    material.aliases.map((alias, index) => (
                      <code key={`${material.id}-${alias}-${index}`}>{alias}</code>
                    ))
                  ) : (
                    <em>None</em>
                  )}
                </div>
                <input
                  aria-label={`${material.name} alias`}
                  value={aliasInputs[material.id] ?? ""}
                  onChange={(event) =>
                    onAliasInputsChange((current) => ({
                      ...current,
                      [material.id]: event.target.value,
                    }))
                  }
                  disabled={isBusy}
                />
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => void onCreateAlias(material.id)}
                  disabled={isBusy}
                  title="Add alias"
                  aria-label={`Add alias for ${material.name}`}
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
