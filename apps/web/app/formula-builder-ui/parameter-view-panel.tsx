import type { ParameterCatalogItem } from "../formula-builder-derived";
import type { ParameterViewPresetKey } from "../formula-builder-model";
import { ParameterPresetPicker } from "./parameter-preset-picker";

type ParameterViewPanelProps = {
  selectedPresetHelper: string;
  showOnlyPositiveParameters: boolean;
  parameterViewPreset: ParameterViewPresetKey;
  parameterCatalog: ParameterCatalogItem[];
  customParameterCodes: string[];
  onShowOnlyPositiveChange: (value: boolean) => void;
  onSelectParameterView: (value: ParameterViewPresetKey) => void;
  onToggleCustomParameterCode: (code: string) => void;
};

export function ParameterViewPanel({
  selectedPresetHelper,
  showOnlyPositiveParameters,
  parameterViewPreset,
  parameterCatalog,
  customParameterCodes,
  onShowOnlyPositiveChange,
  onSelectParameterView,
  onToggleCustomParameterCode,
}: ParameterViewPanelProps) {
  return (
    <div className="parameterViewPanel">
      <div className="parameterViewHeader">
        <span>
          <strong>Que parametros quieres ver</strong>
          <small>{selectedPresetHelper}</small>
        </span>
        <label className="switchControl">
          <input
            type="checkbox"
            checked={showOnlyPositiveParameters}
            onChange={(event) => onShowOnlyPositiveChange(event.target.checked)}
          />
          <span>Solo &gt; 0</span>
        </label>
      </div>
      <ParameterPresetPicker value={parameterViewPreset} onChange={onSelectParameterView} />
      {parameterViewPreset === "custom" ? (
        <div className="parameterPicker">
          {parameterCatalog.map((parameter) => (
            <label key={parameter.code}>
              <input
                type="checkbox"
                checked={customParameterCodes.includes(parameter.code)}
                onChange={() => onToggleCustomParameterCode(parameter.code)}
              />
              <span>
                {parameter.code}
                <small>
                  {parameter.family} - {parameter.positiveMaterialCount}/
                  {parameter.materialCount} con valor
                </small>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
