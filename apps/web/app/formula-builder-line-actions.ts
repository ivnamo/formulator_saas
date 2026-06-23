import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  formulaLinePercentageValue,
  normalizeFormulaLinePercentageInput,
  type BuilderSectionKey,
} from "./formula-builder-model";
import type { CalculationResult } from "./formula-model";
import { isSelectableRawMaterial, type RawMaterial } from "./raw-material-model";
import type { WorkspaceState } from "./workspace-state-model";
import { makeLocalId } from "./workspace-utils";

type FormulaLineActionsOptions = {
  formulaLines: WorkspaceState["formulaLines"];
  rawMaterialsById: Map<string, RawMaterial>;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setBuilderSections: Dispatch<SetStateAction<Record<BuilderSectionKey, boolean>>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  ensureRawMaterialDetail: (rawMaterialId: string) => Promise<RawMaterial | null>;
  markDraftReviewPending: () => void;
  setMessage: (message: string) => void;
};

export function useFormulaLineActions({
  formulaLines,
  rawMaterialsById,
  setWorkspace,
  setBuilderSections,
  setResult,
  ensureRawMaterialDetail,
  markDraftReviewPending,
  setMessage,
}: FormulaLineActionsOptions) {
  const invalidateFormulaResult = useCallback(() => {
    markDraftReviewPending();
    setResult(null);
  }, [markDraftReviewPending, setResult]);

  const addFormulaLine = useCallback(
    async (rawMaterialId: string) => {
      const material = await ensureRawMaterialDetail(rawMaterialId);
      if (material && !isSelectableRawMaterial(material)) {
        setMessage(`${material.name} esta obsoleta y no se puede anadir.`);
        return;
      }
      if (formulaLines.some((line) => line.rawMaterialId === rawMaterialId)) {
        setMessage(`${material?.name ?? "Materia prima"} ya estaba en la formula.`);
        return;
      }
      setWorkspace((current) => ({
        ...current,
        formulaLines: current.formulaLines.some((line) => line.rawMaterialId === rawMaterialId)
          ? current.formulaLines
          : [
              ...current.formulaLines,
              { localId: makeLocalId(), rawMaterialId, percentage: 0 },
            ],
      }));
      setBuilderSections((current) => ({
        ...current,
        formula: true,
        calculation: true,
      }));
      invalidateFormulaResult();
      setMessage(`${material?.name ?? "Materia prima"} anadida correctamente.`);
    },
    [
      ensureRawMaterialDetail,
      formulaLines,
      invalidateFormulaResult,
      setBuilderSections,
      setMessage,
      setWorkspace,
    ],
  );

  const removeFormulaLine = useCallback(
    (localId: string) => {
      setWorkspace((current) => ({
        ...current,
        formulaLines: current.formulaLines.filter((line) => line.localId !== localId),
      }));
      invalidateFormulaResult();
    },
    [invalidateFormulaResult, setWorkspace],
  );

  const updateFormulaLine = useCallback(
    (localId: string, percentage: number) => {
      setWorkspace((current) => ({
        ...current,
        formulaLines: current.formulaLines.map((line) =>
          line.localId === localId
            ? { ...line, percentage: normalizeFormulaLinePercentageInput(percentage) }
            : line,
        ),
      }));
      invalidateFormulaResult();
    },
    [invalidateFormulaResult, setWorkspace],
  );

  const completeFormulaLine = useCallback(
    (localId: string) => {
      let completedPercentage = 0;
      let completedRawMaterialId: string | null = null;
      setWorkspace((current) => {
        const totalPercentage = current.formulaLines.reduce(
          (sum, line) => sum + formulaLinePercentageValue(line.percentage),
          0,
        );
        const missingPercentage = 100 - totalPercentage;
        if (missingPercentage <= 0.0001) {
          return current;
        }
        completedPercentage = missingPercentage;
        completedRawMaterialId =
          current.formulaLines.find((line) => line.localId === localId)?.rawMaterialId ?? null;

        return {
          ...current,
          formulaLines: current.formulaLines.map((line) =>
            line.localId === localId
              ? {
                  ...line,
                  percentage: formulaLinePercentageValue(line.percentage) + missingPercentage,
                }
              : line,
          ),
        };
      });
      invalidateFormulaResult();
      if (completedPercentage > 0) {
        const materialName = completedRawMaterialId
          ? rawMaterialsById.get(completedRawMaterialId)?.name
          : null;
        setMessage(
          `${materialName ?? "Linea"} completada con ${completedPercentage.toFixed(2)}%.`,
        );
      }
    },
    [invalidateFormulaResult, rawMaterialsById, setMessage, setWorkspace],
  );

  const moveFormulaLine = useCallback(
    (localId: string, direction: -1 | 1) => {
      setWorkspace((current) => {
        const index = current.formulaLines.findIndex((line) => line.localId === localId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= current.formulaLines.length) {
          return current;
        }
        const nextLines = [...current.formulaLines];
        const [line] = nextLines.splice(index, 1);
        nextLines.splice(nextIndex, 0, line);
        return {
          ...current,
          formulaLines: nextLines,
        };
      });
      invalidateFormulaResult();
    },
    [invalidateFormulaResult, setWorkspace],
  );

  const duplicateFormulaLine = useCallback(
    (localId: string) => {
      setWorkspace((current) => {
        const index = current.formulaLines.findIndex((line) => line.localId === localId);
        if (index < 0) {
          return current;
        }
        const line = current.formulaLines[index];
        const nextLines = [...current.formulaLines];
        nextLines.splice(index + 1, 0, { ...line, localId: makeLocalId() });
        return {
          ...current,
          formulaLines: nextLines,
        };
      });
      invalidateFormulaResult();
    },
    [invalidateFormulaResult, setWorkspace],
  );

  return {
    addFormulaLine,
    removeFormulaLine,
    updateFormulaLine,
    completeFormulaLine,
    moveFormulaLine,
    duplicateFormulaLine,
  };
}
