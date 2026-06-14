import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { fetchRawMaterialCatalog } from "./raw-material-api";
import {
  mergeRawMaterials,
  toWorkspaceRawMaterialCatalogItem,
  type RawMaterial,
} from "./raw-material-model";
import type { WorkspaceState } from "./workspace-state-model";
import type {
  CatalogParameterCondition,
  ParameterViewPresetKey,
} from "./formula-builder-model";

type CatalogPriceFilter = "all" | "with_price" | "missing_price";

type RawMaterialCatalogOptions = {
  enabled: boolean;
  headers: HeadersInit;
  query: string;
  familyFilter: string;
  priceFilter: CatalogPriceFilter;
  priceMin: string;
  priceMax: string;
  parameterConditions: CatalogParameterCondition[];
  materialResultLimit: number;
  showOnlyPositiveParameters: boolean;
  onMaterialsLoaded: (materials: RawMaterial[]) => void;
  onError: (message: string) => void;
};

type FormulaBuilderCatalogStateOptions = Omit<
  RawMaterialCatalogOptions,
  "onMaterialsLoaded" | "onError"
> & {
  parameterViewPreset: ParameterViewPresetKey;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setMaterialResultLimit: Dispatch<SetStateAction<number>>;
  setError: (message: string) => void;
};

export function useFormulaBuilderCatalogState({
  enabled,
  headers,
  query,
  familyFilter,
  priceFilter,
  priceMin,
  priceMax,
  parameterConditions,
  materialResultLimit,
  showOnlyPositiveParameters,
  parameterViewPreset,
  setWorkspace,
  setMaterialResultLimit,
  setError,
}: FormulaBuilderCatalogStateOptions) {
  const catalogParameterConditionKey = useMemo(
    () =>
      parameterConditions
        .map((condition) => `${condition.code}|${condition.min}|${condition.max}`)
        .join("||"),
    [parameterConditions],
  );

  const mergeCatalogMaterials = useCallback(
    (materials: RawMaterial[]) => {
      setWorkspace((current) => ({
        ...current,
        rawMaterials: mergeRawMaterials(current.rawMaterials, materials),
      }));
    },
    [setWorkspace],
  );

  const handleCatalogError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
    },
    [setError],
  );

  const catalogState = useRawMaterialCatalog({
    enabled,
    headers,
    query,
    familyFilter,
    priceFilter,
    priceMin,
    priceMax,
    parameterConditions,
    materialResultLimit,
    showOnlyPositiveParameters,
    onMaterialsLoaded: mergeCatalogMaterials,
    onError: handleCatalogError,
  });

  useEffect(() => {
    setMaterialResultLimit(500);
  }, [
    catalogParameterConditionKey,
    familyFilter,
    parameterViewPreset,
    priceFilter,
    priceMax,
    priceMin,
    query,
    setMaterialResultLimit,
    showOnlyPositiveParameters,
  ]);

  return catalogState;
}

export function useRawMaterialCatalog({
  enabled,
  headers,
  query,
  familyFilter,
  priceFilter,
  priceMin,
  priceMax,
  parameterConditions,
  materialResultLimit,
  showOnlyPositiveParameters,
  onMaterialsLoaded,
  onError,
}: RawMaterialCatalogOptions) {
  const [catalogMaterialIds, setCatalogMaterialIds] = useState<string[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogFamilies, setCatalogFamilies] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [refreshKey, refreshCatalog] = useReducer((current: number) => current + 1, 0);

  useEffect(() => {
    if (!enabled) {
      setCatalogMaterialIds([]);
      setCatalogTotal(0);
      setCatalogFamilies([]);
      setCatalogLoading(false);
      return;
    }

    let cancelled = false;
    setCatalogLoading(true);
    fetchRawMaterialCatalog(headers, {
      limit: materialResultLimit,
      query,
      family: familyFilter,
      priceFilter,
      priceMin,
      priceMax,
      parameterRanges: parameterConditions,
      onlyPositive: showOnlyPositiveParameters,
    })
      .then((catalog) => {
        if (cancelled) {
          return;
        }
        const materials = catalog.items.map(toWorkspaceRawMaterialCatalogItem);
        setCatalogMaterialIds(materials.map((material) => material.id));
        setCatalogTotal(catalog.total);
        setCatalogFamilies(catalog.families);
        onMaterialsLoaded(materials);
      })
      .catch((error) => {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Could not load raw materials");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    familyFilter,
    headers,
    materialResultLimit,
    onError,
    onMaterialsLoaded,
    parameterConditions,
    priceFilter,
    priceMax,
    priceMin,
    query,
    refreshKey,
    showOnlyPositiveParameters,
  ]);

  return {
    catalogMaterialIds,
    catalogTotal,
    catalogFamilies,
    catalogLoading,
    refreshCatalog,
  };
}
