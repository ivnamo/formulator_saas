import { useMemo, useReducer, type Dispatch, type SetStateAction } from "react";
import {
  DEFAULT_BUILDER_SECTIONS,
  type BuilderSectionKey,
  type CatalogParameterCondition,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import { makeLocalId } from "./workspace-model";

type CatalogPriceFilter = "all" | "with_price" | "missing_price";

type FormulaBuilderUiState = {
  formulaMaterialQuery: string;
  parameterViewPreset: ParameterViewPresetKey;
  customParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  catalogFamilyFilter: string;
  catalogPriceFilter: CatalogPriceFilter;
  catalogPriceMin: string;
  catalogPriceMax: string;
  catalogParameterToAdd: string;
  catalogParameterConditions: CatalogParameterCondition[];
  materialResultLimit: number;
  selectedMaterialId: string | null;
  comparisonMaterialIds: string[];
  expandedMaterialIds: string[];
  builderSections: Record<BuilderSectionKey, boolean>;
};

type FormulaBuilderUiAction =
  | { type: "setFormulaMaterialQuery"; update: SetStateAction<string> }
  | { type: "setParameterViewPreset"; update: SetStateAction<ParameterViewPresetKey> }
  | { type: "setCustomParameterCodes"; update: SetStateAction<string[]> }
  | { type: "setShowOnlyPositiveParameters"; update: SetStateAction<boolean> }
  | { type: "setCatalogFamilyFilter"; update: SetStateAction<string> }
  | { type: "setCatalogPriceFilter"; update: SetStateAction<CatalogPriceFilter> }
  | { type: "setCatalogPriceMin"; update: SetStateAction<string> }
  | { type: "setCatalogPriceMax"; update: SetStateAction<string> }
  | { type: "setCatalogParameterToAdd"; update: SetStateAction<string> }
  | {
      type: "setCatalogParameterConditions";
      update: SetStateAction<CatalogParameterCondition[]>;
    }
  | { type: "setMaterialResultLimit"; update: SetStateAction<number> }
  | { type: "setSelectedMaterialId"; update: SetStateAction<string | null> }
  | { type: "setComparisonMaterialIds"; update: SetStateAction<string[]> }
  | { type: "setExpandedMaterialIds"; update: SetStateAction<string[]> }
  | {
      type: "setBuilderSections";
      update: SetStateAction<Record<BuilderSectionKey, boolean>>;
    }
  | { type: "selectParameterView"; key: ParameterViewPresetKey; fallbackCodes: string[] }
  | { type: "toggleCustomParameterCode"; code: string }
  | { type: "addCatalogParameterCondition"; code?: string }
  | {
      type: "updateCatalogParameterCondition";
      id: string;
      patch: Partial<Omit<CatalogParameterCondition, "id">>;
    }
  | { type: "removeCatalogParameterCondition"; id: string }
  | { type: "resetCatalogFilters" }
  | { type: "toggleBuilderSection"; section: BuilderSectionKey };

const initialFormulaBuilderUiState: FormulaBuilderUiState = {
  formulaMaterialQuery: "",
  parameterViewPreset: "core",
  customParameterCodes: [],
  showOnlyPositiveParameters: true,
  catalogFamilyFilter: "all",
  catalogPriceFilter: "all",
  catalogPriceMin: "",
  catalogPriceMax: "",
  catalogParameterToAdd: "",
  catalogParameterConditions: [],
  materialResultLimit: 60,
  selectedMaterialId: null,
  comparisonMaterialIds: [],
  expandedMaterialIds: [],
  builderSections: DEFAULT_BUILDER_SECTIONS,
};

export function useFormulaBuilderUiState() {
  const [state, dispatch] = useReducer(formulaBuilderUiReducer, initialFormulaBuilderUiState);
  const actions = useMemo(
    () => ({
      setFormulaMaterialQuery: makeSetter(dispatch, "setFormulaMaterialQuery"),
      setParameterViewPreset: makeSetter(dispatch, "setParameterViewPreset"),
      setCustomParameterCodes: makeSetter(dispatch, "setCustomParameterCodes"),
      setShowOnlyPositiveParameters: makeSetter(dispatch, "setShowOnlyPositiveParameters"),
      setCatalogFamilyFilter: makeSetter(dispatch, "setCatalogFamilyFilter"),
      setCatalogPriceFilter: makeSetter(dispatch, "setCatalogPriceFilter"),
      setCatalogPriceMin: makeSetter(dispatch, "setCatalogPriceMin"),
      setCatalogPriceMax: makeSetter(dispatch, "setCatalogPriceMax"),
      setCatalogParameterToAdd: makeSetter(dispatch, "setCatalogParameterToAdd"),
      setCatalogParameterConditions: makeSetter(dispatch, "setCatalogParameterConditions"),
      setMaterialResultLimit: makeSetter(dispatch, "setMaterialResultLimit"),
      setSelectedMaterialId: makeSetter(dispatch, "setSelectedMaterialId"),
      setComparisonMaterialIds: makeSetter(dispatch, "setComparisonMaterialIds"),
      setExpandedMaterialIds: makeSetter(dispatch, "setExpandedMaterialIds"),
      setBuilderSections: makeSetter(dispatch, "setBuilderSections"),
      selectParameterView: (key: ParameterViewPresetKey, fallbackCodes: string[]) =>
        dispatch({ type: "selectParameterView", key, fallbackCodes }),
      toggleCustomParameterCode: (code: string) =>
        dispatch({ type: "toggleCustomParameterCode", code }),
      addCatalogParameterCondition: (code?: string) =>
        dispatch({ type: "addCatalogParameterCondition", code }),
      updateCatalogParameterCondition: (
        id: string,
        patch: Partial<Omit<CatalogParameterCondition, "id">>,
      ) => dispatch({ type: "updateCatalogParameterCondition", id, patch }),
      removeCatalogParameterCondition: (id: string) =>
        dispatch({ type: "removeCatalogParameterCondition", id }),
      resetCatalogFilters: () => dispatch({ type: "resetCatalogFilters" }),
      toggleBuilderSection: (section: BuilderSectionKey) =>
        dispatch({ type: "toggleBuilderSection", section }),
    }),
    [dispatch],
  );

  return {
    ...state,
    ...actions,
  };
}

function formulaBuilderUiReducer(
  state: FormulaBuilderUiState,
  action: FormulaBuilderUiAction,
): FormulaBuilderUiState {
  switch (action.type) {
    case "setFormulaMaterialQuery":
      return { ...state, formulaMaterialQuery: resolveUpdate(state.formulaMaterialQuery, action.update) };
    case "setParameterViewPreset":
      return { ...state, parameterViewPreset: resolveUpdate(state.parameterViewPreset, action.update) };
    case "setCustomParameterCodes":
      return { ...state, customParameterCodes: resolveUpdate(state.customParameterCodes, action.update) };
    case "setShowOnlyPositiveParameters":
      return {
        ...state,
        showOnlyPositiveParameters: resolveUpdate(state.showOnlyPositiveParameters, action.update),
      };
    case "setCatalogFamilyFilter":
      return { ...state, catalogFamilyFilter: resolveUpdate(state.catalogFamilyFilter, action.update) };
    case "setCatalogPriceFilter":
      return { ...state, catalogPriceFilter: resolveUpdate(state.catalogPriceFilter, action.update) };
    case "setCatalogPriceMin":
      return { ...state, catalogPriceMin: resolveUpdate(state.catalogPriceMin, action.update) };
    case "setCatalogPriceMax":
      return { ...state, catalogPriceMax: resolveUpdate(state.catalogPriceMax, action.update) };
    case "setCatalogParameterToAdd":
      return {
        ...state,
        catalogParameterToAdd: resolveUpdate(state.catalogParameterToAdd, action.update),
      };
    case "setCatalogParameterConditions":
      return {
        ...state,
        catalogParameterConditions: resolveUpdate(state.catalogParameterConditions, action.update),
      };
    case "setMaterialResultLimit":
      return { ...state, materialResultLimit: resolveUpdate(state.materialResultLimit, action.update) };
    case "setSelectedMaterialId":
      return { ...state, selectedMaterialId: resolveUpdate(state.selectedMaterialId, action.update) };
    case "setComparisonMaterialIds":
      return {
        ...state,
        comparisonMaterialIds: resolveUpdate(state.comparisonMaterialIds, action.update),
      };
    case "setExpandedMaterialIds":
      return {
        ...state,
        expandedMaterialIds: resolveUpdate(state.expandedMaterialIds, action.update),
      };
    case "setBuilderSections":
      return { ...state, builderSections: resolveUpdate(state.builderSections, action.update) };
    case "selectParameterView":
      return {
        ...state,
        parameterViewPreset: action.key,
        customParameterCodes:
          action.key === "custom" && state.customParameterCodes.length === 0
            ? action.fallbackCodes.slice(0, 8)
            : state.customParameterCodes,
      };
    case "toggleCustomParameterCode":
      return {
        ...state,
        parameterViewPreset: "custom",
        customParameterCodes: state.customParameterCodes.includes(action.code)
          ? state.customParameterCodes.filter((candidate) => candidate !== action.code)
          : [...state.customParameterCodes, action.code],
      };
    case "addCatalogParameterCondition": {
      const normalizedCode = (action.code ?? state.catalogParameterToAdd).trim();
      if (
        !normalizedCode ||
        state.catalogParameterConditions.some((condition) => condition.code === normalizedCode)
      ) {
        return state;
      }
      return {
        ...state,
        catalogParameterToAdd: "",
        catalogParameterConditions: [
          ...state.catalogParameterConditions,
          {
            id: makeLocalId(),
            code: normalizedCode,
            min: "",
            max: "",
          },
        ],
      };
    }
    case "updateCatalogParameterCondition":
      return {
        ...state,
        catalogParameterConditions: state.catalogParameterConditions.map((condition) =>
          condition.id === action.id
            ? {
                ...condition,
                ...action.patch,
              }
            : condition,
        ),
      };
    case "removeCatalogParameterCondition":
      return {
        ...state,
        catalogParameterConditions: state.catalogParameterConditions.filter(
          (condition) => condition.id !== action.id,
        ),
      };
    case "resetCatalogFilters":
      return {
        ...state,
        formulaMaterialQuery: "",
        catalogFamilyFilter: "all",
        catalogPriceFilter: "all",
        catalogPriceMin: "",
        catalogPriceMax: "",
        catalogParameterToAdd: "",
        catalogParameterConditions: [],
      };
    case "toggleBuilderSection":
      return {
        ...state,
        builderSections: {
          ...state.builderSections,
          [action.section]: !state.builderSections[action.section],
        },
      };
    default:
      return state;
  }
}

function resolveUpdate<T>(current: T, update: SetStateAction<T>) {
  return typeof update === "function" ? (update as (value: T) => T)(current) : update;
}

type FormulaBuilderSetAction = Extract<FormulaBuilderUiAction, { update: unknown }>;

function makeSetter<T extends FormulaBuilderSetAction["type"]>(
  dispatch: Dispatch<FormulaBuilderUiAction>,
  type: T,
) {
  return (update: Extract<FormulaBuilderSetAction, { type: T }>["update"]) =>
    dispatch({ type, update } as FormulaBuilderUiAction);
}
