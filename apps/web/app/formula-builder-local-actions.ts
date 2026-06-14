import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ParameterViewPresetKey } from "./formula-builder-model";
import type { FormulaBasicsValue } from "./formula-builder-ui/formula-basics-step";
import type { WorkspaceState } from "./workspace-state-model";

type FormulaBuilderLocalActionsOptions = {
  catalogTotal: number;
  visibleParameterCodes: string[];
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setMaterialResultLimit: Dispatch<SetStateAction<number>>;
  setComparisonMaterialIds: Dispatch<SetStateAction<string[]>>;
  selectParameterView: (key: ParameterViewPresetKey, fallbackCodes: string[]) => void;
  markDraftReviewPending: () => void;
};

export function useFormulaBuilderLocalActions({
  catalogTotal,
  visibleParameterCodes,
  setWorkspace,
  setMaterialResultLimit,
  setComparisonMaterialIds,
  selectParameterView,
  markDraftReviewPending,
}: FormulaBuilderLocalActionsOptions) {
  const updateFormulaBasics = useCallback(
    (patch: Partial<FormulaBasicsValue>) => {
      setWorkspace((current) => ({
        ...current,
        ...patch,
      }));
      markDraftReviewPending();
    },
    [markDraftReviewPending, setWorkspace],
  );

  const loadMoreCatalogMaterials = useCallback(() => {
    setMaterialResultLimit((current) => Math.min(current + 500, catalogTotal));
  }, [catalogTotal, setMaterialResultLimit]);

  const selectCurrentParameterView = useCallback(
    (key: ParameterViewPresetKey) => {
      selectParameterView(key, visibleParameterCodes);
    },
    [selectParameterView, visibleParameterCodes],
  );

  const clearComparisonMaterials = useCallback(() => {
    setComparisonMaterialIds([]);
  }, [setComparisonMaterialIds]);

  return {
    updateFormulaBasics,
    loadMoreCatalogMaterials,
    selectCurrentParameterView,
    clearComparisonMaterials,
  };
}
