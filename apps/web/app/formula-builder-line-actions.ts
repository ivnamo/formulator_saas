import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { BuilderSectionKey } from "./formula-builder-model";
import {
  makeLocalId,
  type CalculationResult,
  type RawMaterial,
  type WorkspaceState,
} from "./workspace-model";

type FormulaLineActionsOptions = {
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setBuilderSections: Dispatch<SetStateAction<Record<BuilderSectionKey, boolean>>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  ensureRawMaterialDetail: (rawMaterialId: string) => Promise<RawMaterial | null>;
  markDraftReviewPending: () => void;
};

export function useFormulaLineActions({
  setWorkspace,
  setBuilderSections,
  setResult,
  ensureRawMaterialDetail,
  markDraftReviewPending,
}: FormulaLineActionsOptions) {
  const invalidateFormulaResult = useCallback(() => {
    markDraftReviewPending();
    setResult(null);
  }, [markDraftReviewPending, setResult]);

  const addFormulaLine = useCallback(
    async (rawMaterialId: string) => {
      await ensureRawMaterialDetail(rawMaterialId);
      setWorkspace((current) => ({
        ...current,
        formulaLines: [
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
    },
    [ensureRawMaterialDetail, invalidateFormulaResult, setBuilderSections, setWorkspace],
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
          line.localId === localId ? { ...line, percentage } : line,
        ),
      }));
      invalidateFormulaResult();
    },
    [invalidateFormulaResult, setWorkspace],
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
    moveFormulaLine,
    duplicateFormulaLine,
  };
}
