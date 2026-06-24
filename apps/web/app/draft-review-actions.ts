import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { BuilderSectionKey } from "./formula-builder-model";
import { calculateAdHocFormula } from "./formula-calculation-api";
import type { AgentFormulaCandidate, AgentPlan } from "./ai-workflow-model";
import type { CalculationResult, FormulaCalculationHistory } from "./formula-model";
import type { FormulaLine } from "./workspace-base-model";
import type { DraftReviewState } from "./workspace-comparison";
import type { WorkspaceState } from "./workspace-state-model";
import { makeLocalId } from "./workspace-utils";

type DraftReviewActionsOptions = {
  workspace: WorkspaceState;
  draftReview: DraftReviewState | null;
  agentPlan: AgentPlan | null;
  headers: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setCalculationHistory: Dispatch<SetStateAction<FormulaCalculationHistory[]>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setBuilderSections: Dispatch<SetStateAction<Record<BuilderSectionKey, boolean>>>;
  setDraftReview: Dispatch<SetStateAction<DraftReviewState | null>>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useDraftReviewActions({
  workspace,
  draftReview,
  agentPlan,
  headers,
  setWorkspace,
  setCalculationHistory,
  setResult,
  setBuilderSections,
  setDraftReview,
  runAction,
  setError,
  setMessage,
}: DraftReviewActionsOptions) {
  const markDraftReviewPending = useCallback(() => {
    setDraftReview((current) =>
      current && current.status === "confirmed"
        ? { ...current, reviewedResult: null, status: "pending" }
        : current,
    );
  }, [setDraftReview]);

  const updateDraftReviewNotes = useCallback(
    (notes: string) => {
      setDraftReview((current) =>
        current
          ? {
              ...current,
              notes,
              reviewedResult: current.status === "confirmed" ? null : current.reviewedResult,
              status: current.status === "confirmed" ? "pending" : current.status,
            }
          : current,
      );
    },
    [setDraftReview],
  );

  const calculateDraftFormula = useCallback(
    (lines: FormulaLine[], requiredParameterCodes: string[] = []) =>
      calculateAdHocFormula(headers, lines, requiredParameterCodes),
    [headers],
  );

  const confirmDraftReview = useCallback(async () => {
    if (!draftReview) {
      return;
    }
    const notes = draftReview.notes.trim();
    if (notes.length < 3) {
      setError("Decision notes are required before saving a draft");
      return;
    }

    await runAction("Confirming draft review", async () => {
      const reviewedResult = await calculateDraftFormula(
        workspace.formulaLines,
        draftReview.requiredParameterCodes,
      );
      setDraftReview((current) =>
        current
          ? {
              ...current,
              notes,
              reviewedResult,
              status: "confirmed",
            }
          : current,
      );
      setResult(reviewedResult);
      setMessage("Draft review confirmed");
    });
  }, [
    calculateDraftFormula,
    draftReview,
    runAction,
    setDraftReview,
    setError,
    setMessage,
    setResult,
    workspace.formulaLines,
  ]);

  const applyOptimizerDraft = useCallback(
    async (candidate: AgentFormulaCandidate) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!candidate.items.length) {
        setError("Draft candidate has no formula lines");
        return;
      }

      const candidateMaterials = new Map(
        agentPlan?.candidate_research?.candidates.map((material) => [
          material.raw_material_id,
          material,
        ]) ?? [],
      );
      const formulaLines = candidate.items.map((item) => ({
        localId: makeLocalId(),
        rawMaterialId: item.raw_material_id,
        percentage: item.percentage,
      }));
      const requiredParameterCodes = candidate.parameters.map((parameter) => parameter.code);

      await runAction("Applying optimizer draft", async () => {
        const calculation = await calculateDraftFormula(formulaLines, requiredParameterCodes);
        setWorkspace((current) => {
          const existingMaterialIds = new Set(
            current.rawMaterials.map((material) => material.id),
          );
          const addedMaterials = candidate.items
            .filter((item) => !existingMaterialIds.has(item.raw_material_id))
            .map((item) => {
              const material = candidateMaterials.get(item.raw_material_id);
              const activeParameter = current.parameter
                ? material?.parameters[current.parameter.code]
                : undefined;
              const activeParameterMap =
                current.parameter && activeParameter
                  ? {
                      [current.parameter.code]: {
                        parameterId: current.parameter.id,
                        code: current.parameter.code,
                        name: current.parameter.name,
                        value: activeParameter.value,
                        unit: activeParameter.unit,
                        source: null,
                        confidence: null,
                      },
                    }
                  : {};
              return {
                id: item.raw_material_id,
                detailLoaded: true,
                code: material?.code ?? null,
                externalCode: null,
                name: item.name,
                family: null,
                subfamily: null,
                physicalState: null,
                density: null,
                phMin: null,
                phMax: null,
                solubility: null,
                notes: null,
                isActive: true,
                isObsolete: false,
                price: material?.price_eur_per_kg ?? null,
                priceCurrency: material?.price_eur_per_kg == null ? null : "EUR",
                priceUnit: material?.price_eur_per_kg == null ? null : "kg",
                priceSupplier: null,
                priceSource: material?.price_eur_per_kg == null ? null : "ai_research",
                priceValidFrom: null,
                parameterValue: activeParameter?.value ?? null,
                parameterCount: Object.keys(activeParameterMap).length,
                positiveParameterCount: Object.values(activeParameterMap).filter(
                  (parameter) => Math.abs(parameter.value) > 0.0001,
                ).length,
                parameters: activeParameterMap,
                aliases: [],
              };
            });
          return {
            ...current,
            rawMaterials: [...current.rawMaterials, ...addedMaterials],
            formulaId: null,
            formulaBaseName: null,
            formulaBaseVersion: null,
            formulaBuilderMode: "new",
            formulaName: `${candidate.name} Review Draft`,
            formulaLines,
          };
        });
        setCalculationHistory([]);
        setResult(calculation);
        setBuilderSections((current) => ({
          ...current,
          formula: true,
          calculation: true,
        }));
        setDraftReview({
          candidateName: candidate.name,
          baselineLines: candidate.items.map((item) => ({
            rawMaterialId: item.raw_material_id,
            name: item.name,
            percentage: item.percentage,
          })),
          baselineResult: calculation,
          reviewedResult: null,
          requiredParameterCodes,
          status: "pending",
          notes: "",
        });
        setMessage("Optimizer draft applied and recalculated");
      });
    },
    [
      agentPlan?.candidate_research?.candidates,
      calculateDraftFormula,
      runAction,
      setBuilderSections,
      setCalculationHistory,
      setDraftReview,
      setError,
      setMessage,
      setResult,
      setWorkspace,
      workspace.tenant,
    ],
  );

  return {
    markDraftReviewPending,
    updateDraftReviewNotes,
    confirmDraftReview,
    applyOptimizerDraft,
  };
}
