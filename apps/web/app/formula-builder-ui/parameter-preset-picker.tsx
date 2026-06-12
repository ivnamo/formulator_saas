import {
  PARAMETER_VIEW_PRESETS,
  type ParameterViewPresetKey,
} from "../formula-builder-model";

type ParameterPresetPickerProps = {
  value: ParameterViewPresetKey;
  onChange: (value: ParameterViewPresetKey) => void;
  compact?: boolean;
};

export function ParameterPresetPicker({
  value,
  onChange,
  compact = false,
}: ParameterPresetPickerProps) {
  return (
    <div
      className={compact ? "parameterPresetList compactPresetList" : "parameterPresetList"}
      role="list"
      aria-label="Vistas de parametros"
    >
      {PARAMETER_VIEW_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className="segmentedChip"
          type="button"
          data-selected={value === preset.key}
          onClick={() => onChange(preset.key)}
          title={preset.helper}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
