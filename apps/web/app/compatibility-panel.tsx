import { Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { CompatibilityRuleRead } from "./compatibility-model";
import type { CompatibilityRuleForm } from "./compatibility-state";
import type { RawMaterial } from "./raw-material-model";

type CompatibilityPanelProps = {
  active: boolean;
  rules: CompatibilityRuleRead[];
  rawMaterials: RawMaterial[];
  rawMaterialsById: Map<string, RawMaterial>;
  form: CompatibilityRuleForm;
  canEditTenantData: boolean;
  canCreateRule: boolean;
  onFormChange: Dispatch<SetStateAction<CompatibilityRuleForm>>;
  onCreateRule: () => void | Promise<void>;
};

export function CompatibilityPanel({
  active,
  rules,
  rawMaterials,
  rawMaterialsById,
  form,
  canEditTenantData,
  canCreateRule,
  onFormChange,
  onCreateRule,
}: CompatibilityPanelProps) {
  const cannotPickPair = !canEditTenantData || rawMaterials.length < 2;

  return (
    <section id="compatibility" className="panel compatibilityPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Compatibility</h2>
        <span>{rules.length} rules</span>
      </div>
      <div className="compatibilityForm">
        <label>
          <span>Material A</span>
          <select
            aria-label="Compatibility material A"
            value={form.materialAId}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                materialAId: event.target.value,
              }))
            }
            disabled={cannotPickPair}
          >
            <option value="">Select material</option>
            {rawMaterials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Material B</span>
          <select
            aria-label="Compatibility material B"
            value={form.materialBId}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                materialBId: event.target.value,
              }))
            }
            disabled={cannotPickPair}
          >
            <option value="">Select material</option>
            {rawMaterials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Severity</span>
          <select
            aria-label="Compatibility severity"
            value={form.severity}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                severity: event.target.value,
              }))
            }
            disabled={!canEditTenantData}
          >
            <option value="warning">warning</option>
            <option value="blocker">blocker</option>
            <option value="info">info</option>
          </select>
        </label>
        <label>
          <span>Message</span>
          <input
            value={form.message}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Recommended action</span>
          <input
            value={form.recommendedAction}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                recommendedAction: event.target.value,
              }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateRule()}
          disabled={!canCreateRule}
        >
          <Save size={17} />
          Save rule
        </button>
      </div>
      <div className="compatibilityList">
        {rules.length === 0 ? (
          <div className="empty">No compatibility rules yet.</div>
        ) : (
          rules.map((rule) => {
            const materialNames =
              rule.condition_json.raw_material_ids
                ?.map((id) => rawMaterialsById.get(id)?.name ?? `Material ${id.slice(0, 8)}`)
                .join(" + ") ?? "Material pair";

            return (
              <div className="compatibilityRow" key={rule.id}>
                <code data-severity={rule.severity}>{rule.severity}</code>
                <span>{materialNames}</span>
                <strong>{rule.message}</strong>
                <span>{rule.condition_json.recommended_action ?? "-"}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
