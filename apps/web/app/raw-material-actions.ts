import { useCallback, type Dispatch, type SetStateAction } from "react";
import { request } from "./workspace-api";
import {
  mergeRawMaterials,
  parseOptionalNumber,
  toWorkspaceRawMaterial,
  withRawMaterialAlias,
  type CalculationResult,
  type MaterialForm,
  type RawMaterial,
  type RawMaterialAliasRead,
  type RawMaterialRead,
  type WorkspaceState,
} from "./workspace-model";

type RawMaterialActionsOptions = {
  workspace: WorkspaceState;
  rawMaterialsById: Map<string, RawMaterial>;
  detailedMaterialIds: string[];
  materialForm: MaterialForm;
  aliasInputs: Record<string, string>;
  headers: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setDetailedMaterialIds: Dispatch<SetStateAction<string[]>>;
  setSelectedMaterialId: Dispatch<SetStateAction<string | null>>;
  setComparisonMaterialIds: Dispatch<SetStateAction<string[]>>;
  setExpandedMaterialIds: Dispatch<SetStateAction<string[]>>;
  setMaterialForm: Dispatch<SetStateAction<MaterialForm>>;
  setAliasInputs: Dispatch<SetStateAction<Record<string, string>>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  refreshCatalog: () => void;
  resetImportState: () => void;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useRawMaterialActions({
  workspace,
  rawMaterialsById,
  detailedMaterialIds,
  materialForm,
  aliasInputs,
  headers,
  setWorkspace,
  setDetailedMaterialIds,
  setSelectedMaterialId,
  setComparisonMaterialIds,
  setExpandedMaterialIds,
  setMaterialForm,
  setAliasInputs,
  setResult,
  refreshCatalog,
  resetImportState,
  runAction,
  setError,
  setMessage,
}: RawMaterialActionsOptions) {
  const ensureRawMaterialDetail = useCallback(
    async (rawMaterialId: string): Promise<RawMaterial | null> => {
      const existing = rawMaterialsById.get(rawMaterialId);
      if (existing && detailedMaterialIds.includes(rawMaterialId)) {
        return existing;
      }
      if (!workspace.tenant) {
        return existing ?? null;
      }

      try {
        const material = await request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}`, {
          method: "GET",
          headers,
        });
        const detailed = toWorkspaceRawMaterial(
          material,
          {
            parameterValue: workspace.parameter
              ? (material.parameters.find((parameter) => parameter.code === workspace.parameter?.code)
                  ?.value ?? null)
              : null,
          },
          workspace.parameters,
        );
        setWorkspace((current) => ({
          ...current,
          rawMaterials: mergeRawMaterials(current.rawMaterials, [detailed]),
        }));
        setDetailedMaterialIds((current) =>
          current.includes(rawMaterialId) ? current : [...current, rawMaterialId],
        );
        return detailed;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not load raw material detail");
        return existing ?? null;
      }
    },
    [
      detailedMaterialIds,
      headers,
      rawMaterialsById,
      setDetailedMaterialIds,
      setError,
      setWorkspace,
      workspace.parameter,
      workspace.parameters,
      workspace.tenant,
    ],
  );

  const inspectMaterial = useCallback(
    async (rawMaterialId: string) => {
      setSelectedMaterialId(rawMaterialId);
      await ensureRawMaterialDetail(rawMaterialId);
    },
    [ensureRawMaterialDetail, setSelectedMaterialId],
  );

  const toggleCompareMaterial = useCallback(
    async (rawMaterialId: string) => {
      setComparisonMaterialIds((current) =>
        current.includes(rawMaterialId)
          ? current.filter((id) => id !== rawMaterialId)
          : [...current.slice(-2), rawMaterialId],
      );
      await ensureRawMaterialDetail(rawMaterialId);
    },
    [ensureRawMaterialDetail, setComparisonMaterialIds],
  );

  const toggleExpandedMaterial = useCallback(
    async (rawMaterialId: string) => {
      setExpandedMaterialIds((current) =>
        current.includes(rawMaterialId)
          ? current.filter((candidate) => candidate !== rawMaterialId)
          : [...current, rawMaterialId],
      );
      await ensureRawMaterialDetail(rawMaterialId);
    },
    [ensureRawMaterialDetail, setExpandedMaterialIds],
  );

  const createMaterial = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!materialForm.name.trim()) {
      setError("Raw material name is required");
      return;
    }

    await runAction("Creating raw material", async () => {
      const material = await request<RawMaterialRead>("/api/v1/raw-materials", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: materialForm.code.trim() || null,
          name: materialForm.name.trim(),
        }),
      });
      const price = parseOptionalNumber(materialForm.price);
      const parameterValue = parseOptionalNumber(materialForm.parameterValue);

      if (price !== null) {
        await request<Record<string, unknown>>(`/api/v1/raw-materials/${material.id}/prices`, {
          method: "POST",
          headers,
          body: JSON.stringify({ price, currency: "EUR", unit: "kg" }),
        });
      }
      if (workspace.parameter && parameterValue !== null) {
        await request<Record<string, unknown>>(
          `/api/v1/raw-materials/${material.id}/parameter-values`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              parameter_id: workspace.parameter.id,
              value: parameterValue,
            }),
          },
        );
      }

      setWorkspace((current) => {
        const fullMaterial = toWorkspaceRawMaterial(
          material,
          {
            price,
            parameterValue: current.parameter ? parameterValue : null,
          },
          current.parameters,
        );
        if (current.parameter && parameterValue !== null) {
          fullMaterial.parameters[current.parameter.code] = {
            parameterId: current.parameter.id,
            code: current.parameter.code,
            name: current.parameter.name,
            value: parameterValue,
            unit: current.parameter.unit,
            source: "manual",
            confidence: null,
          };
          fullMaterial.positiveParameterCount = Object.values(fullMaterial.parameters).filter(
            (parameter) => Math.abs(parameter.value) > 0.0001,
          ).length;
        }
        return {
          ...current,
          rawMaterials: mergeRawMaterials(current.rawMaterials, [fullMaterial]),
        };
      });
      setDetailedMaterialIds((current) =>
        current.includes(material.id) ? current : [...current, material.id],
      );
      refreshCatalog();
      setMaterialForm({ code: "", name: "", price: "", parameterValue: "" });
      setResult(null);
      resetImportState();
      setMessage("Raw material ready");
    });
  }, [
    headers,
    materialForm,
    refreshCatalog,
    resetImportState,
    runAction,
    setDetailedMaterialIds,
    setError,
    setMaterialForm,
    setMessage,
    setResult,
    setWorkspace,
    workspace.parameter,
    workspace.tenant,
  ]);

  const createAlias = useCallback(
    async (rawMaterialId: string) => {
      const alias = aliasInputs[rawMaterialId]?.trim();
      if (!alias) {
        setError("Alias is required");
        return;
      }

      await runAction("Creating alias", async () => {
        const created = await request<RawMaterialAliasRead>(
          `/api/v1/raw-materials/${rawMaterialId}/aliases`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ alias }),
          },
        );
        setWorkspace((current) => ({
          ...current,
          rawMaterials: withRawMaterialAlias(current.rawMaterials, rawMaterialId, created.alias),
        }));
        refreshCatalog();
        setAliasInputs((current) => ({ ...current, [rawMaterialId]: "" }));
        resetImportState();
        setMessage("Alias ready");
      });
    },
    [
      aliasInputs,
      headers,
      refreshCatalog,
      resetImportState,
      runAction,
      setAliasInputs,
      setError,
      setMessage,
      setWorkspace,
    ],
  );

  return {
    ensureRawMaterialDetail,
    inspectMaterial,
    toggleCompareMaterial,
    toggleExpandedMaterial,
    createMaterial,
    createAlias,
  };
}
