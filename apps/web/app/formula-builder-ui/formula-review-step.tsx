import { Download, Loader2, Save } from "lucide-react";
import type { BuilderSectionKey, FormulaBuilderMode } from "../formula-builder-model";
import { BuilderStep } from "./builder-step";
import { JiraReviewPanel, type JiraReviewPanelProps } from "./jira-review-panel";

export type FormulaReviewStepProps = JiraReviewPanelProps & {
  isOpen: boolean;
  formulaId: string | null;
  formulaBaseName: string | null;
  formulaBuilderMode: FormulaBuilderMode;
  formulaName: string;
  isFormulaBalanced: boolean;
  totalPercentage: number;
  canSaveFormula: boolean;
  canExportExcel: boolean;
  blankFormulaLineCount: number;
  onToggle: (section: BuilderSectionKey) => void;
  onSaveFormula: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
};

export function FormulaReviewStep({
  isOpen,
  formulaId,
  formulaBaseName,
  formulaBuilderMode,
  formulaName,
  isFormulaBalanced,
  totalPercentage,
  canSaveFormula,
  canExportExcel,
  blankFormulaLineCount,
  onToggle,
  onSaveFormula,
  onExportExcel,
  ...jiraReviewProps
}: FormulaReviewStepProps) {
  const connectionStatus = jiraReviewProps.activeJiraConnection
    ? "Jira configurado"
    : "Jira no configurado";
  const reviewCount = jiraReviewProps.formulaReviewRequests.length;
  const reviewLabel = reviewCount === 1 ? "1 revision" : `${reviewCount} revisiones`;
  const saveMode = formulaId ? formulaBuilderMode : "new";
  const saveIntent = formulaSaveIntent(
    saveMode,
    Boolean(formulaId),
    formulaBaseName ?? formulaName,
  );

  return (
    <BuilderStep
      section="review"
      title="5. Revision y salidas"
      summary={`${connectionStatus} - ${reviewLabel}`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="formulaSavePanel" data-balanced={isFormulaBalanced}>
        <div>
          <span>Guardar y exportar</span>
          <strong>
            {isFormulaBalanced
              ? "Lista para guardar"
              : `No se puede guardar: suma ${totalPercentage.toFixed(1)}%`}
          </strong>
          <small>
            {isFormulaBalanced
              ? "Se guardara la formula y se recalculara el precio final oficial."
              : "El guardado queda bloqueado hasta que la formula sume 100.0%."}
          </small>
          {blankFormulaLineCount > 0 ? (
            <small className="inlineWarning">
              {blankFormulaLineCount === 1
                ? "Hay 1 porcentaje en blanco; al guardar se convertira en 0."
                : `Hay ${blankFormulaLineCount} porcentajes en blanco; al guardar se convertiran en 0.`}
            </small>
          ) : null}
          <span className="formulaSaveIntent">
            {saveIntent.title}
            <small>{saveIntent.description}</small>
          </span>
        </div>
        <div className="formulaSaveActions">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onExportExcel()}
            disabled={!canExportExcel}
          >
            <Download size={17} />
            Exportar Excel I+D
          </button>
          <button
            className="primaryButton"
            type="button"
            onClick={() => void onSaveFormula()}
            disabled={!canSaveFormula}
          >
            {jiraReviewProps.isBusy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            {saveIntent.buttonLabel}
          </button>
        </div>
      </div>
      <JiraReviewPanel {...jiraReviewProps} />
    </BuilderStep>
  );
}

function formulaSaveIntent(
  mode: FormulaBuilderMode,
  hasLoadedFormula: boolean,
  formulaName: string,
) {
  const loadedName = formulaName.trim() || "la formula cargada";
  if (mode === "editing" && hasLoadedFormula) {
    return {
      title: "Se actualizara la formula cargada",
      description: `Guardar pisara los datos actuales de ${loadedName}.`,
      buttonLabel: "Actualizar formula cargada",
    };
  }
  if (mode === "version" && hasLoadedFormula) {
    return {
      title: "Se creara una nueva version",
      description: `Guardar creara otro registro basado en ${loadedName}.`,
      buttonLabel: "Guardar nueva version",
    };
  }
  if (hasLoadedFormula) {
    return {
      title: "Se creara una formula nueva",
      description: `Guardar duplicara/derivara ${loadedName} sin modificarla.`,
      buttonLabel: "Guardar formula nueva",
    };
  }
  return {
    title: "Se creara una formula nueva",
    description: "Guardar creara el primer registro de esta formula en biblioteca.",
    buttonLabel: "Guardar formula nueva",
  };
}
