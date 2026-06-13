import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  applySapRawMaterialImport,
  createRawMaterial,
  createRawMaterialAlias,
  createRawMaterialParameterValue,
  createRawMaterialPrice,
  fetchRawMaterialPrices,
  previewSapRawMaterialImport,
  fetchRawMaterialDetail,
  updateRawMaterial,
} from "./raw-material-api";
import {
  mergeRawMaterials,
  toWorkspaceRawMaterial,
  withManualParameterValue,
  withRawMaterialAlias,
  type MaterialForm,
  type RawMaterial,
  type RawMaterialImportRead,
  type RawMaterialPriceForm,
  type RawMaterialPriceRead,
  type RawMaterialUpdateForm,
  type SapRawMaterialImportForm,
} from "./raw-material-model";
import type { CalculationResult } from "./formula-model";
import type { WorkspaceState } from "./workspace-state-model";
import { parseOptionalNumber } from "./workspace-utils";

type RawMaterialActionsOptions = {
  workspace: WorkspaceState;
  rawMaterialsById: Map<string, RawMaterial>;
  detailedMaterialIds: string[];
  materialForm: MaterialForm;
  aliasInputs: Record<string, string>;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
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
  uploadHeaders,
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
        const material = await fetchRawMaterialDetail(headers, rawMaterialId);
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
      const material = await createRawMaterial(headers, materialForm);
      const price = parseOptionalNumber(materialForm.price);
      const parameterValue = parseOptionalNumber(materialForm.parameterValue);

      if (price !== null) {
        await createRawMaterialPrice(headers, material.id, {
          price: String(price),
          currency: "EUR",
          unit: "kg",
          supplier: "",
          source: "manual",
          validFrom: "",
        });
      }
      if (workspace.parameter && parameterValue !== null) {
        await createRawMaterialParameterValue(
          headers,
          material.id,
          workspace.parameter,
          parameterValue,
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
          return {
            ...current,
            rawMaterials: mergeRawMaterials(current.rawMaterials, [
              withManualParameterValue(fullMaterial, current.parameter, parameterValue),
            ]),
          };
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
        const created = await createRawMaterialAlias(headers, rawMaterialId, alias);
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

  const updateMaterial = useCallback(
    async (rawMaterialId: string, materialUpdateForm: RawMaterialUpdateForm) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return null;
      }
      if (!materialUpdateForm.name.trim()) {
        setError("Raw material name is required");
        return null;
      }

      let updatedMaterial: RawMaterial | null = null;
      await runAction("Updating raw material", async () => {
        const material = await updateRawMaterial(headers, rawMaterialId, materialUpdateForm);
        updatedMaterial = toWorkspaceRawMaterial(
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
          rawMaterials: mergeRawMaterials(current.rawMaterials, [updatedMaterial as RawMaterial]),
        }));
        setDetailedMaterialIds((current) =>
          current.includes(material.id) ? current : [...current, material.id],
        );
        refreshCatalog();
        resetImportState();
        setMessage("Raw material updated");
      });
      return updatedMaterial;
    },
    [
      headers,
      refreshCatalog,
      resetImportState,
      runAction,
      setDetailedMaterialIds,
      setError,
      setMessage,
      setWorkspace,
      workspace.parameters,
      workspace.tenant,
    ],
  );

  const loadMaterialPriceHistory = useCallback(
    async (rawMaterialId: string): Promise<RawMaterialPriceRead[]> => {
      if (!workspace.tenant) {
        return [];
      }
      try {
        return await fetchRawMaterialPrices(headers, rawMaterialId);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not load price history");
        return [];
      }
    },
    [headers, setError, workspace.tenant],
  );

  const addMaterialPrice = useCallback(
    async (
      rawMaterialId: string,
      priceForm: RawMaterialPriceForm,
    ): Promise<RawMaterialPriceRead[]> => {
      const parsedPrice = parseOptionalNumber(priceForm.price);
      if (parsedPrice === null) {
        setError("Price is required");
        return [];
      }
      if (parsedPrice < 0) {
        setError("Price cannot be negative");
        return [];
      }

      let priceHistory: RawMaterialPriceRead[] = [];
      await runAction("Updating raw material price", async () => {
        const created = await createRawMaterialPrice(headers, rawMaterialId, priceForm);
        setWorkspace((current) => ({
          ...current,
          rawMaterials: current.rawMaterials.map((material) =>
            material.id === rawMaterialId
              ? {
                  ...material,
                  price: created.price,
                  priceCurrency: created.currency,
                  priceUnit: created.unit,
                  priceSupplier: created.supplier,
                  priceSource: created.source,
                  priceValidFrom: created.valid_from,
                }
              : material,
          ),
        }));
        priceHistory = await fetchRawMaterialPrices(headers, rawMaterialId);
        refreshCatalog();
        resetImportState();
        setMessage("Raw material price updated");
      });
      return priceHistory;
    },
    [
      headers,
      refreshCatalog,
      resetImportState,
      runAction,
      setError,
      setMessage,
      setWorkspace,
    ],
  );

  const previewSapImport = useCallback(
    async (
      file: File,
      sapImportForm: SapRawMaterialImportForm,
    ): Promise<RawMaterialImportRead | null> => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return null;
      }

      let preview: RawMaterialImportRead | null = null;
      await runAction("Previewing SAP raw material import", async () => {
        preview = await previewSapRawMaterialImport(uploadHeaders, file, sapImportForm);
        setMessage("SAP preview ready");
      });
      return preview;
    },
    [runAction, setError, setMessage, uploadHeaders, workspace.tenant],
  );

  const applySapImport = useCallback(
    async (importId: string): Promise<RawMaterialImportRead | null> => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return null;
      }

      let applied: RawMaterialImportRead | null = null;
      await runAction("Applying SAP raw material import", async () => {
        applied = await applySapRawMaterialImport(headers, importId);
        refreshCatalog();
        resetImportState();
        setMessage("SAP raw material import applied");
      });
      return applied;
    },
    [
      headers,
      refreshCatalog,
      resetImportState,
      runAction,
      setError,
      setMessage,
      workspace.tenant,
    ],
  );

  return {
    ensureRawMaterialDetail,
    inspectMaterial,
    toggleCompareMaterial,
    toggleExpandedMaterial,
    createMaterial,
    createAlias,
    updateMaterial,
    loadMaterialPriceHistory,
    addMaterialPrice,
    previewSapImport,
    applySapImport,
  };
}
