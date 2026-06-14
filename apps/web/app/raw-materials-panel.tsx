import {
  Atom,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  History,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  buildRawMaterialUpdateForm,
  type MaterialForm,
  type RawMaterial,
  type RawMaterialImportRead,
  type RawMaterialPriceForm,
  type RawMaterialPriceRead,
  type RawMaterialUpdateForm,
  type SapRawMaterialImportForm,
} from "./raw-material-model";
import type { Parameter } from "./workspace-base-model";

type RawMaterialsPanelProps = {
  active: boolean;
  rawMaterials: RawMaterial[];
  parameter: Parameter | null;
  parameters: Parameter[];
  materialForm: MaterialForm;
  aliasInputs: Record<string, string>;
  canEditTenantData: boolean;
  isBusy: boolean;
  onMaterialFormChange: Dispatch<SetStateAction<MaterialForm>>;
  onAliasInputsChange: Dispatch<SetStateAction<Record<string, string>>>;
  onCreateMaterial: () => void | Promise<void>;
  onInspectMaterial: (rawMaterialId: string) => void | Promise<void>;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
  onCreateAlias: (rawMaterialId: string) => void | Promise<void>;
  onUpdateMaterial: (
    rawMaterialId: string,
    form: RawMaterialUpdateForm,
  ) => RawMaterial | null | Promise<RawMaterial | null>;
  onUpdateMaterialParameterValue: (
    rawMaterialId: string,
    parameter: Parameter,
    value: number,
  ) => RawMaterial | null | Promise<RawMaterial | null>;
  onLoadMaterialPriceHistory: (rawMaterialId: string) => Promise<RawMaterialPriceRead[]>;
  onAddMaterialPrice: (
    rawMaterialId: string,
    form: RawMaterialPriceForm,
  ) => Promise<RawMaterialPriceRead[]>;
  onPreviewSapImport: (
    file: File,
    form: SapRawMaterialImportForm,
  ) => Promise<RawMaterialImportRead | null>;
  onApplySapImport: (importId: string) => Promise<RawMaterialImportRead | null>;
};

type MaterialStatusFilter = "all" | "active" | "obsolete";
type MaterialPriceFilter = "all" | "with_price" | "missing_price";
type MaterialSapFilter = "all" | "with_sap" | "missing_sap";
type TechnicalParameterFilter = {
  id: string;
  parameterId: string;
  min: string;
  max: string;
};

const LEGACY_PARAMETER_FAMILIES = [
  {
    name: "Macronutriente",
    terms: ["n", "ntotal", "norg", "nnitr", "nure", "namo", "k2o", "p2o5"],
  },
  { name: "Secundario", terms: ["cao", "mgo", "so3"] },
  { name: "Micronutriente", terms: ["zn", "mn", "fe", "cu", "b", "mo", "co", "sio2"] },
  {
    name: "Fraccion organica",
    terms: [
      "mseca",
      "morg",
      "corg",
      "extracto humico total",
      "acidos fulvicos",
      "acidos humicos",
      "extracto de algas",
      "polisacaridos",
    ],
  },
  { name: "Aminoacidos", terms: ["sum aa totales", "sum aa libres"] },
  {
    name: "Aminograma",
    terms: [
      "ac aspartico",
      "ac glutamico",
      "alanina",
      "glicina",
      "histidina",
      "isoleucina",
      "leucina",
      "lisina",
      "lys",
      "serina",
      "tirosina",
      "treonina",
      "valina",
      "arginina",
      "fenilalanina",
      "metionina",
      "prolina",
      "hidroxiprolina",
      "triptofano",
    ],
  },
  { name: "Metales pesados", terms: ["as", "hg", "pb", "cd", "cr", "ni"] },
] as const;

const emptyPriceForm: RawMaterialPriceForm = {
  price: "",
  currency: "EUR",
  unit: "kg",
  supplier: "",
  source: "manual",
  validFrom: "",
};

function createDefaultSapForm(): SapRawMaterialImportForm {
  return {
    source: "sap",
    sheetName: "",
    validFrom: new Date().toISOString().slice(0, 10),
  };
}

export function RawMaterialsPanel({
  active,
  rawMaterials,
  parameter,
  parameters,
  materialForm,
  aliasInputs,
  canEditTenantData,
  isBusy,
  onMaterialFormChange,
  onAliasInputsChange,
  onCreateMaterial,
  onInspectMaterial,
  onAddFormulaLine,
  onCreateAlias,
  onUpdateMaterial,
  onUpdateMaterialParameterValue,
  onLoadMaterialPriceHistory,
  onAddMaterialPrice,
  onPreviewSapImport,
  onApplySapImport,
}: RawMaterialsPanelProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>("all");
  const [priceFilter, setPriceFilter] = useState<MaterialPriceFilter>("all");
  const [priceMinFilter, setPriceMinFilter] = useState("");
  const [priceMaxFilter, setPriceMaxFilter] = useState("");
  const [sapFilter, setSapFilter] = useState<MaterialSapFilter>("all");
  const [parameterFamilyFilters, setParameterFamilyFilters] = useState<string[]>([]);
  const [selectedTechnicalParameterId, setSelectedTechnicalParameterId] = useState("");
  const [technicalParameterFilters, setTechnicalParameterFilters] = useState<
    TechnicalParameterFilter[]
  >([]);
  const [compositionQuery, setCompositionQuery] = useState("");
  const [compositionFamilyFilter, setCompositionFamilyFilter] = useState("all");
  const [showAllComposition, setShowAllComposition] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RawMaterialUpdateForm | null>(null);
  const [parameterDrafts, setParameterDrafts] = useState<Record<string, string>>({});
  const [priceForm, setPriceForm] = useState<RawMaterialPriceForm>(emptyPriceForm);
  const [priceHistory, setPriceHistory] = useState<RawMaterialPriceRead[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [sapFile, setSapFile] = useState<File | null>(null);
  const [sapForm, setSapForm] = useState<SapRawMaterialImportForm>(createDefaultSapForm);
  const [sapPreview, setSapPreview] = useState<RawMaterialImportRead | null>(null);
  const [sapNotice, setSapNotice] = useState("");

  const summary = useMemo(() => buildMaterialSummary(rawMaterials), [rawMaterials]);
  const parameterFamilyOptions = useMemo(() => buildParameterFamilyOptions(parameters), [parameters]);
  const parameterById = useMemo(
    () => new Map(parameters.map((candidate) => [candidate.id, candidate])),
    [parameters],
  );
  const priceBounds = useMemo(() => buildPriceBounds(rawMaterials), [rawMaterials]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = normalizeFilterText(query);
    const parsedPriceMin = parseOptionalNumber(priceMinFilter);
    const parsedPriceMax = parseOptionalNumber(priceMaxFilter);
    return rawMaterials.filter((material) => {
      if (
        normalizedQuery &&
        ![
          material.code,
          material.externalCode,
          material.name,
          material.family,
          ...material.aliases,
        ]
          .filter(Boolean)
          .some((value) => normalizeFilterText(String(value)).includes(normalizedQuery))
      ) {
        return false;
      }
      if (statusFilter === "active" && (!material.isActive || material.isObsolete)) {
        return false;
      }
      if (statusFilter === "obsolete" && !material.isObsolete) {
        return false;
      }
      if (priceFilter === "with_price" && material.price === null) {
        return false;
      }
      if (priceFilter === "missing_price" && material.price !== null) {
        return false;
      }
      if (sapFilter === "with_sap" && !material.externalCode) {
        return false;
      }
      if (sapFilter === "missing_sap" && material.externalCode) {
        return false;
      }
      if (parsedPriceMin !== null && (material.price === null || material.price < parsedPriceMin)) {
        return false;
      }
      if (parsedPriceMax !== null && (material.price === null || material.price > parsedPriceMax)) {
        return false;
      }
      if (
        parameterFamilyFilters.length > 0 &&
        !parameterFamilyFilters.some((familyName) =>
          materialHasValueInFamily(material, parameters, familyName),
        )
      ) {
        return false;
      }
      if (
        technicalParameterFilters.some((filter) => {
          const candidate = parameterById.get(filter.parameterId);
          if (!candidate) {
            return false;
          }
          const value = material.parameters[candidate.code]?.value ?? 0;
          const min = parseOptionalNumber(filter.min);
          const max = parseOptionalNumber(filter.max);
          return (min !== null && value < min) || (max !== null && value > max);
        })
      ) {
        return false;
      }
      return true;
    });
  }, [
    parameterById,
    parameterFamilyFilters,
    parameters,
    priceFilter,
    priceMaxFilter,
    priceMinFilter,
    query,
    rawMaterials,
    sapFilter,
    statusFilter,
    technicalParameterFilters,
  ]);

  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) {
      return null;
    }
    return rawMaterials.find((material) => material.id === selectedMaterialId) ?? null;
  }, [rawMaterials, selectedMaterialId]);

  useEffect(() => {
    if (selectedMaterialId && rawMaterials.some((material) => material.id === selectedMaterialId)) {
      return;
    }
    const nextMaterialId = rawMaterials[0]?.id ?? null;
    setSelectedMaterialId(nextMaterialId);
    if (nextMaterialId) {
      void onInspectMaterial(nextMaterialId);
    }
  }, [onInspectMaterial, rawMaterials, selectedMaterialId]);

  useEffect(() => {
    if (!selectedMaterial || selectedMaterial.detailLoaded) {
      return;
    }
    void onInspectMaterial(selectedMaterial.id);
  }, [onInspectMaterial, selectedMaterial]);

  useEffect(() => {
    setEditForm(selectedMaterial ? buildRawMaterialUpdateForm(selectedMaterial) : null);
    setParameterDrafts(selectedMaterial ? buildParameterDrafts(selectedMaterial, parameters) : {});
    setPriceForm(emptyPriceForm);
  }, [parameters, selectedMaterial]);

  const visibleCompositionParameters = useMemo(() => {
    if (!selectedMaterial) {
      return [];
    }
    const normalizedQuery = normalizeFilterText(compositionQuery);
    const shouldShowOnlyPositive =
      !showAllComposition && !normalizedQuery && compositionFamilyFilter === "all";

    return parameters
      .filter((candidate) => {
        const value = selectedMaterial.parameters[candidate.code]?.value ?? 0;
        const hasValue = Math.abs(value) > 0.0001;
        if (shouldShowOnlyPositive && !hasValue) {
          return false;
        }
        if (
          compositionFamilyFilter !== "all" &&
          !parameterBelongsToFamily(candidate, compositionFamilyFilter)
        ) {
          return false;
        }
        if (
          normalizedQuery &&
          !getParameterSearchTerms(candidate).some((valueToSearch) =>
            normalizeFilterText(valueToSearch).includes(normalizedQuery),
          )
        ) {
          return false;
        }
        return true;
      })
      .sort((left, right) => {
        const leftValue = Math.abs(selectedMaterial.parameters[left.code]?.value ?? 0);
        const rightValue = Math.abs(selectedMaterial.parameters[right.code]?.value ?? 0);
        return Number(rightValue > 0.0001) - Number(leftValue > 0.0001);
      });
  }, [
    compositionFamilyFilter,
    compositionQuery,
    parameters,
    selectedMaterial,
    showAllComposition,
  ]);

  useEffect(() => {
    if (!selectedMaterial) {
      setPriceHistory([]);
      setPriceLoading(false);
      return;
    }

    let cancelled = false;
    setPriceLoading(true);
    onLoadMaterialPriceHistory(selectedMaterial.id)
      .then((history) => {
        if (!cancelled) {
          setPriceHistory(history);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPriceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onLoadMaterialPriceHistory, selectedMaterial]);

  async function saveSelectedMaterial() {
    if (!selectedMaterial || !editForm) {
      return;
    }
    const updated = await onUpdateMaterial(selectedMaterial.id, editForm);
    if (updated) {
      setEditForm(buildRawMaterialUpdateForm(updated));
    }
  }

  async function selectMaterial(rawMaterialId: string) {
    setSelectedMaterialId(rawMaterialId);
    await onInspectMaterial(rawMaterialId);
  }

  async function saveSelectedParameterValue(parameterToUpdate: Parameter) {
    if (!selectedMaterial) {
      return;
    }
    const value = parseDraftNumber(parameterDrafts[parameterToUpdate.id] ?? "");
    if (value === null) {
      return;
    }
    const updated = await onUpdateMaterialParameterValue(
      selectedMaterial.id,
      parameterToUpdate,
      value,
    );
    if (updated) {
      setParameterDrafts(buildParameterDrafts(updated, parameters));
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setPriceFilter("all");
    setPriceMinFilter("");
    setPriceMaxFilter("");
    setSapFilter("all");
    setParameterFamilyFilters([]);
    setSelectedTechnicalParameterId("");
    setTechnicalParameterFilters([]);
  }

  function toggleParameterFamilyFilter(familyName: string) {
    setParameterFamilyFilters((current) =>
      current.includes(familyName)
        ? current.filter((candidate) => candidate !== familyName)
        : [...current, familyName],
    );
  }

  function addTechnicalParameterFilter() {
    const parameterId = selectedTechnicalParameterId || parameters[0]?.id;
    if (!parameterId) {
      return;
    }
    setTechnicalParameterFilters((current) => {
      if (current.some((filter) => filter.parameterId === parameterId)) {
        return current;
      }
      return [
        ...current,
        {
          id: `${parameterId}-${Date.now()}`,
          parameterId,
          min: "",
          max: "",
        },
      ];
    });
    setSelectedTechnicalParameterId("");
  }

  function updateTechnicalParameterFilter(
    filterId: string,
    patch: Partial<Omit<TechnicalParameterFilter, "id">>,
  ) {
    setTechnicalParameterFilters((current) =>
      current.map((filter) => (filter.id === filterId ? { ...filter, ...patch } : filter)),
    );
  }

  function removeTechnicalParameterFilter(filterId: string) {
    setTechnicalParameterFilters((current) => current.filter((filter) => filter.id !== filterId));
  }

  async function saveSelectedPrice() {
    if (!selectedMaterial) {
      return;
    }
    const nextHistory = await onAddMaterialPrice(selectedMaterial.id, priceForm);
    if (nextHistory.length > 0) {
      setPriceHistory(nextHistory);
      setPriceForm(emptyPriceForm);
    }
  }

  async function previewSapFile() {
    if (!sapFile) {
      setSapNotice("Select a SAP file first.");
      return;
    }
    setSapNotice("");
    const preview = await onPreviewSapImport(sapFile, sapForm);
    setSapPreview(preview);
  }

  async function applySapPreview() {
    if (!sapPreview) {
      return;
    }
    const applied = await onApplySapImport(sapPreview.id);
    if (applied) {
      setSapPreview(applied);
      setSapNotice("SAP import applied.");
    }
  }

  const readySapRows = sapPreview?.rows.filter((row) => row.status === "ready").length ?? 0;
  const activeAdvancedFilterCount =
    Number(Boolean(priceMinFilter || priceMaxFilter)) +
    parameterFamilyFilters.length +
    technicalParameterFilters.length;
  const selectedCompositionLabel =
    compositionFamilyFilter === "all" ? "All families" : compositionFamilyFilter;

  return (
    <section id="materials" className="panel materialPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Raw material master</h2>
        <span>{rawMaterials.length} rows</span>
      </div>

      <div className="materialSummary">
        <SummaryMetric label="Total" value={summary.total} />
        <SummaryMetric label="Active" value={summary.active} />
        <SummaryMetric label="Missing price" value={summary.missingPrice} />
        <SummaryMetric label="Missing SAP" value={summary.missingSap} />
        <SummaryMetric label="Obsolete" value={summary.obsolete} />
      </div>

      <div className="materialForm">
        <label>
          <span>Code</span>
          <input
            value={materialForm.code}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, code: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Name</span>
          <input
            value={materialForm.name}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, name: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Price EUR/kg</span>
          <input
            inputMode="decimal"
            value={materialForm.price}
            onChange={(event) =>
              onMaterialFormChange((current) => ({ ...current, price: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>{parameter ? parameter.name : "Value"}</span>
          <input
            inputMode="decimal"
            value={materialForm.parameterValue}
            onChange={(event) =>
              onMaterialFormChange((current) => ({
                ...current,
                parameterValue: event.target.value,
              }))
            }
            disabled={!canEditTenantData || !parameter}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateMaterial()}
          disabled={!canEditTenantData}
        >
          <Plus size={17} />
          Add material
        </button>
      </div>

      <div className="rawMaterialFilterPanel">
        <div className="materialFilterPrimary">
          <label className="materialSearch">
            <span>Search</span>
            <div className="inputWithIcon">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code, SAP, name, family, alias"
              />
            </div>
          </label>
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MaterialStatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="obsolete">Obsolete</option>
            </select>
          </label>
          <label>
            <span>Price</span>
            <select
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value as MaterialPriceFilter)}
            >
              <option value="all">All</option>
              <option value="with_price">With price</option>
              <option value="missing_price">Missing price</option>
            </select>
          </label>
          <label>
            <span>SAP</span>
            <select
              value={sapFilter}
              onChange={(event) => setSapFilter(event.target.value as MaterialSapFilter)}
            >
              <option value="all">All</option>
              <option value="with_sap">With SAP code</option>
              <option value="missing_sap">Missing SAP code</option>
            </select>
          </label>
          <button className="iconTextButton" type="button" onClick={resetFilters}>
            <X size={16} />
            Reset
          </button>
        </div>

        <details className="materialAdvancedFilters" open>
          <summary>
            <span>
              <SlidersHorizontal size={16} />
              Advanced filters
            </span>
            <code>
              {filteredMaterials.length}/{rawMaterials.length}
              {activeAdvancedFilterCount ? ` | ${activeAdvancedFilterCount} active` : ""}
            </code>
          </summary>
          <div className="materialAdvancedFilterGrid">
            <fieldset className="materialRangeFilter">
              <legend>Price range EUR/kg</legend>
              <div>
                <label>
                  <span>Min</span>
                  <input
                    inputMode="decimal"
                    value={priceMinFilter}
                    onChange={(event) => setPriceMinFilter(event.target.value)}
                    placeholder={priceBounds.min === null ? "-" : priceBounds.min.toFixed(2)}
                  />
                </label>
                <label>
                  <span>Max</span>
                  <input
                    inputMode="decimal"
                    value={priceMaxFilter}
                    onChange={(event) => setPriceMaxFilter(event.target.value)}
                    placeholder={priceBounds.max === null ? "-" : priceBounds.max.toFixed(2)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="materialFamilyFilters">
              <legend>Parameter families</legend>
              <div className="filterChipGroup">
                {parameterFamilyOptions.map((family) => (
                  <button
                    key={family.name}
                    type="button"
                    className="filterChip"
                    data-selected={parameterFamilyFilters.includes(family.name)}
                    onClick={() => toggleParameterFamilyFilter(family.name)}
                  >
                    {family.name}
                    <span>{family.parameters.length}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="technicalFilters">
              <legend>Technical columns</legend>
              <div className="technicalFilterBuilder">
                <select
                  value={selectedTechnicalParameterId}
                  onChange={(event) => setSelectedTechnicalParameterId(event.target.value)}
                  aria-label="Technical parameter"
                >
                  <option value="">Select parameter</option>
                  {parameters.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.code} | {candidate.name}
                    </option>
                  ))}
                </select>
                <button
                  className="iconButton"
                  type="button"
                  onClick={addTechnicalParameterFilter}
                  disabled={parameters.length === 0}
                  title="Add technical filter"
                  aria-label="Add technical filter"
                >
                  <Plus size={16} />
                </button>
              </div>
              {technicalParameterFilters.length ? (
                <div className="technicalFilterList">
                  {technicalParameterFilters.map((filter) => {
                    const candidate = parameterById.get(filter.parameterId);
                    return (
                      <div className="technicalFilterRow" key={filter.id}>
                        <strong>{candidate ? candidate.code : "Parameter"}</strong>
                        <label>
                          <span>Min</span>
                          <input
                            inputMode="decimal"
                            value={filter.min}
                            onChange={(event) =>
                              updateTechnicalParameterFilter(filter.id, {
                                min: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>Max</span>
                          <input
                            inputMode="decimal"
                            value={filter.max}
                            onChange={(event) =>
                              updateTechnicalParameterFilter(filter.id, {
                                max: event.target.value,
                              })
                            }
                          />
                        </label>
                        <button
                          className="iconButton"
                          type="button"
                          onClick={() => removeTechnicalParameterFilter(filter.id)}
                          title="Remove technical filter"
                          aria-label={`Remove ${candidate?.name ?? "technical"} filter`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </fieldset>
          </div>
        </details>
      </div>

      <div className="materialMasterGrid">
        <div className="materialList" role="list">
          {filteredMaterials.length === 0 ? (
            <div className="empty">No raw materials match these filters.</div>
          ) : (
            filteredMaterials.map((material) => (
              <article
                className="materialListItem"
                data-selected={selectedMaterialId === material.id}
                key={material.id}
                role="listitem"
              >
                <button
                  className="materialSelectButton"
                  type="button"
                  onClick={() => void selectMaterial(material.id)}
                >
                  <span className="materialIdentity">
                    <strong>{material.name}</strong>
                    <MaterialIdentityCodes material={material} />
                  </span>
                </button>
                <div className="materialListMeta">
                  <span>{material.family || "-"}</span>
                  <MaterialParameterSummary material={material} />
                </div>
                <div className="materialListAside">
                  <strong>{formatPrice(material)}</strong>
                  <StatusPill material={material} />
                </div>
                <div className="rowActions">
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void selectMaterial(material.id)}
                    title="Open material"
                    aria-label={`Open ${material.name}`}
                    data-selected={selectedMaterialId === material.id}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void onAddFormulaLine(material.id)}
                    disabled={isBusy}
                    title="Add to formula"
                    aria-label={`Add ${material.name} to formula`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="materialDetail">
          {selectedMaterial && editForm ? (
            <>
              <div className="materialDetailHeader">
                <div>
                  <span>Selected material</span>
                  <h3>{selectedMaterial.name}</h3>
                </div>
                <StatusPill material={selectedMaterial} />
              </div>

              <div className="materialDetailForm">
                <label>
                  <span>Code</span>
                  <input
                    value={editForm.code}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, code: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>SAP code</span>
                  <input
                    value={editForm.externalCode}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, externalCode: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label className="wide">
                  <span>Name</span>
                  <input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, name: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>Family</span>
                  <input
                    value={editForm.family}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, family: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>Subfamily</span>
                  <input
                    value={editForm.subfamily}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, subfamily: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>Physical state</span>
                  <input
                    value={editForm.physicalState}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, physicalState: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>Density</span>
                  <input
                    inputMode="decimal"
                    value={editForm.density}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, density: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>pH min</span>
                  <input
                    inputMode="decimal"
                    value={editForm.phMin}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, phMin: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label>
                  <span>pH max</span>
                  <input
                    inputMode="decimal"
                    value={editForm.phMax}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, phMax: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label className="wide">
                  <span>Solubility</span>
                  <input
                    value={editForm.solubility}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, solubility: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
                <label className="wide">
                  <span>Notes</span>
                  <textarea
                    value={editForm.notes}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, notes: event.target.value } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                </label>
              </div>

              <div className="materialSwitches">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, isActive: event.target.checked } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                  <span>Active</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isObsolete}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, isObsolete: event.target.checked } : current,
                      )
                    }
                    disabled={!canEditTenantData}
                  />
                  <span>Obsolete</span>
                </label>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => void saveSelectedMaterial()}
                  disabled={!canEditTenantData || isBusy}
                >
                  <Save size={16} />
                  Save master
                </button>
              </div>

              <div className="materialParametersPanel">
                <div className="sectionTitle">
                  <Atom size={16} />
                  <strong>Chemical composition</strong>
                  <span>
                    {selectedMaterial.positiveParameterCount}/{parameters.length}
                  </span>
                </div>
                <div className="materialCompositionToolbar">
                  <label className="compositionSearch">
                    <span>Find parameter</span>
                    <div className="inputWithIcon">
                      <Search size={15} />
                      <input
                        value={compositionQuery}
                        onChange={(event) => setCompositionQuery(event.target.value)}
                        placeholder="Code, name, family"
                      />
                    </div>
                  </label>
                  <label>
                    <span>Parameter</span>
                    <select
                      aria-label="Jump to parameter"
                      value=""
                      onChange={(event) => {
                        const candidate = parameterById.get(event.target.value);
                        if (!candidate) {
                          return;
                        }
                        setCompositionFamilyFilter("all");
                        setCompositionQuery(candidate.code);
                      }}
                    >
                      <option value="">Jump to parameter</option>
                      {parameters.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.code} | {candidate.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Family</span>
                    <select
                      value={compositionFamilyFilter}
                      onChange={(event) => setCompositionFamilyFilter(event.target.value)}
                    >
                      <option value="all">All families</option>
                      {parameterFamilyOptions.map((family) => (
                        <option key={family.name} value={family.name}>
                          {family.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="segmentedButtons" aria-label="Composition visibility">
                    <button
                      type="button"
                      data-selected={!showAllComposition}
                      onClick={() => setShowAllComposition(false)}
                    >
                      With value
                    </button>
                    <button
                      type="button"
                      data-selected={showAllComposition}
                      onClick={() => setShowAllComposition(true)}
                    >
                      All
                    </button>
                  </div>
                </div>
                <div className="compositionFamilyChips">
                  {parameterFamilyOptions.map((family) => (
                    <button
                      key={family.name}
                      type="button"
                      className="filterChip"
                      data-selected={compositionFamilyFilter === family.name}
                      onClick={() =>
                        setCompositionFamilyFilter((current) =>
                          current === family.name ? "all" : family.name,
                        )
                      }
                    >
                      {family.name}
                    </button>
                  ))}
                </div>
                <div className="materialParameterEditor">
                  {visibleCompositionParameters.length ? (
                    visibleCompositionParameters.map((candidate) => {
                      const currentValue = selectedMaterial.parameters[candidate.code];
                      return (
                        <div
                          className="materialParameterRow"
                          data-has-value={Boolean(
                            currentValue && Math.abs(currentValue.value) > 0.0001,
                          )}
                          key={candidate.id}
                        >
                          <div>
                            <strong>{candidate.name}</strong>
                            <span>
                              <code>{candidate.code}</code>
                              {getParameterFamilyNames(candidate).join(", ") ||
                                selectedCompositionLabel}
                            </span>
                          </div>
                          <label>
                            <input
                              aria-label={`${candidate.name} value`}
                              inputMode="decimal"
                              value={parameterDrafts[candidate.id] ?? ""}
                              onChange={(event) =>
                                setParameterDrafts((current) => ({
                                  ...current,
                                  [candidate.id]: event.target.value,
                                }))
                              }
                              disabled={!canEditTenantData}
                            />
                            <span>{candidate.unit ?? ""}</span>
                          </label>
                          <code>{currentValue?.source ?? "-"}</code>
                          <button
                            className="iconButton"
                            type="button"
                            onClick={() => void saveSelectedParameterValue(candidate)}
                            disabled={!canEditTenantData || isBusy}
                            title="Save value"
                            aria-label={`Save ${candidate.name} value`}
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      );
                    })
                  ) : parameters.length ? (
                    <div className="empty">No parameters match this composition filter.</div>
                  ) : (
                    <div className="empty">No active parameters.</div>
                  )}
                </div>
              </div>

              <div className="aliasEditor materialDetailAliases">
                <span>Aliases</span>
                <div className="aliasTags">
                  {selectedMaterial.aliases.length ? (
                    selectedMaterial.aliases.map((alias, index) => (
                      <code key={`${selectedMaterial.id}-${alias}-${index}`}>{alias}</code>
                    ))
                  ) : (
                    <em>None</em>
                  )}
                </div>
                <input
                  aria-label={`${selectedMaterial.name} alias`}
                  value={aliasInputs[selectedMaterial.id] ?? ""}
                  onChange={(event) =>
                    onAliasInputsChange((current) => ({
                      ...current,
                      [selectedMaterial.id]: event.target.value,
                    }))
                  }
                  disabled={isBusy || !canEditTenantData}
                />
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => void onCreateAlias(selectedMaterial.id)}
                  disabled={isBusy || !canEditTenantData}
                  title="Add alias"
                  aria-label={`Add alias for ${selectedMaterial.name}`}
                >
                  <Save size={16} />
                </button>
              </div>

              <div className="priceHistoryPanel">
                <div className="sectionTitle">
                  <History size={16} />
                  <strong>Price history</strong>
                </div>
                <div className="priceForm">
                  <label>
                    <span>Price</span>
                    <input
                      inputMode="decimal"
                      value={priceForm.price}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, price: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <label>
                    <span>Currency</span>
                    <input
                      value={priceForm.currency}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, currency: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <label>
                    <span>Unit</span>
                    <input
                      value={priceForm.unit}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, unit: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <label>
                    <span>Supplier</span>
                    <input
                      value={priceForm.supplier}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, supplier: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <label>
                    <span>Source</span>
                    <input
                      value={priceForm.source}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, source: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <label>
                    <span>Valid from</span>
                    <input
                      type="date"
                      value={priceForm.validFrom}
                      onChange={(event) =>
                        setPriceForm((current) => ({ ...current, validFrom: event.target.value }))
                      }
                      disabled={!canEditTenantData}
                    />
                  </label>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => void saveSelectedPrice()}
                    disabled={!canEditTenantData || isBusy}
                  >
                    <Plus size={16} />
                    Add price
                  </button>
                </div>
                <div className="priceHistoryList">
                  {priceLoading ? (
                    <div className="empty">Loading prices.</div>
                  ) : priceHistory.length === 0 ? (
                    <div className="empty">No price history yet.</div>
                  ) : (
                    priceHistory.map((price) => (
                      <div key={price.id}>
                        <strong>{price.price.toFixed(4)}</strong>
                        <span>
                          {price.currency}/{price.unit}
                        </span>
                        <span>{formatDate(price.valid_from)}</span>
                        <code>{price.source}</code>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty">Select a raw material to edit its master record.</div>
          )}
        </aside>
      </div>

      <div className="sapImportPanel">
        <div className="sectionTitle">
          <FileSpreadsheet size={16} />
          <strong>SAP raw material upload</strong>
          {sapPreview ? <span>{sapPreview.status}</span> : null}
        </div>
        <div className="sapImportControls">
          <label>
            <span>Excel or CSV</span>
            <input
              type="file"
              accept=".xlsx,.xlsm,.csv"
              onChange={(event) => {
                setSapFile(event.target.files?.[0] ?? null);
                setSapPreview(null);
                setSapNotice("");
              }}
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Source</span>
            <input
              value={sapForm.source}
              onChange={(event) =>
                setSapForm((current) => ({ ...current, source: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Sheet</span>
            <input
              value={sapForm.sheetName}
              onChange={(event) =>
                setSapForm((current) => ({ ...current, sheetName: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <label>
            <span>Valid from</span>
            <input
              type="date"
              value={sapForm.validFrom}
              onChange={(event) =>
                setSapForm((current) => ({ ...current, validFrom: event.target.value }))
              }
              disabled={!canEditTenantData}
            />
          </label>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void previewSapFile()}
            disabled={!canEditTenantData || isBusy}
          >
            <Upload size={16} />
            Preview SAP
          </button>
          <button
            className="primaryButton"
            type="button"
            onClick={() => void applySapPreview()}
            disabled={!canEditTenantData || isBusy || !sapPreview || readySapRows === 0}
          >
            <CheckCircle2 size={16} />
            Apply ready rows
          </button>
        </div>
        {sapNotice ? <p className="inlineNotice">{sapNotice}</p> : null}
        {sapPreview ? <SapImportPreview preview={sapPreview} /> : null}
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ material }: { material: RawMaterial }) {
  const label = material.isObsolete ? "Obsolete" : material.isActive ? "Active" : "Inactive";
  return <code className="statusPill">{label}</code>;
}

function MaterialIdentityCodes({ material }: { material: RawMaterial }) {
  const values = [
    material.code ? { label: "Code", value: material.code } : null,
    material.externalCode ? { label: "SAP", value: material.externalCode } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const uniqueValues = values.filter(
    (item, index) =>
      values.findIndex(
        (candidate) => candidate.value.trim().toLowerCase() === item.value.trim().toLowerCase(),
      ) === index,
  );

  if (uniqueValues.length === 0) {
    return <span className="materialIdentityMeta">No code</span>;
  }

  return (
    <span className="materialIdentityMeta">
      {uniqueValues.map((item) => (
        <code key={`${item.label}-${item.value}`} title={`${item.label}: ${item.value}`}>
          {item.label}: {item.value}
        </code>
      ))}
    </span>
  );
}

function MaterialParameterSummary({ material }: { material: RawMaterial }) {
  const positiveValues = Object.values(material.parameters)
    .filter((parameter) => Math.abs(parameter.value) > 0.0001)
    .slice(0, 3);

  if (positiveValues.length > 0) {
    return (
      <span className="materialParameterSummary">
        {positiveValues.map((parameter) => (
          <code key={parameter.code}>{formatParameterValue(parameter)}</code>
        ))}
      </span>
    );
  }

  if (material.parameterCount > 0) {
    return (
      <span className="materialParameterSummary empty">
        <em>{material.positiveParameterCount}/{material.parameterCount} values</em>
      </span>
    );
  }

  return (
    <span className="materialParameterSummary empty">
      <em>-</em>
    </span>
  );
}

function SapImportPreview({ preview }: { preview: RawMaterialImportRead }) {
  const summaryEntries = [
    ["New", preview.summary_json.new_material],
    ["Price", preview.summary_json.price_update],
    ["Metadata", preview.summary_json.metadata_update],
    ["Review", preview.summary_json.needs_review],
    ["Errors", preview.summary_json.error],
  ];

  return (
    <div className="sapImportPreview">
      <div className="sapImportSummary">
        {summaryEntries.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{Number(value ?? 0)}</strong>
          </div>
        ))}
      </div>
      <div className="sapImportRows">
        <div className="sapImportHead">
          <span>Row</span>
          <span>Action</span>
          <span>Status</span>
          <span>Name</span>
          <span>SAP</span>
          <span>Price</span>
          <span>Message</span>
        </div>
        {preview.rows.slice(0, 80).map((row) => {
          const parsed = row.raw_row_json.parsed ?? {};
          return (
            <div className="sapImportRow" data-status={row.status} key={row.id}>
              <code>{row.row_number}</code>
              <code>{formatImportAction(row.action)}</code>
              <code>{row.status}</code>
              <span>{parsed.name ?? row.raw_name ?? "-"}</span>
              <span>{parsed.external_code ?? "-"}</span>
              <span>
                {typeof parsed.price === "number"
                  ? `${parsed.price.toFixed(4)} ${parsed.currency ?? "EUR"}`
                  : "-"}
              </span>
              <small>{row.message ?? "-"}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMaterialSummary(rawMaterials: RawMaterial[]) {
  return rawMaterials.reduce(
    (summary, material) => ({
      total: summary.total + 1,
      active: summary.active + (material.isActive && !material.isObsolete ? 1 : 0),
      missingPrice: summary.missingPrice + (material.price === null ? 1 : 0),
      missingSap: summary.missingSap + (material.externalCode ? 0 : 1),
      obsolete: summary.obsolete + (material.isObsolete ? 1 : 0),
    }),
    { total: 0, active: 0, missingPrice: 0, missingSap: 0, obsolete: 0 },
  );
}

function buildPriceBounds(rawMaterials: RawMaterial[]) {
  const prices = rawMaterials
    .map((material) => material.price)
    .filter((price): price is number => typeof price === "number");
  if (prices.length === 0) {
    return { min: null, max: null };
  }
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

function buildParameterFamilyOptions(parameters: Parameter[]) {
  const familyOptions = LEGACY_PARAMETER_FAMILIES.map((family) => ({
    name: family.name,
    parameters: parameters.filter((candidate) => parameterBelongsToFamily(candidate, family.name)),
  })).filter((family) => family.parameters.length > 0);
  const groupedParameterIds = new Set(
    familyOptions.flatMap((family) => family.parameters.map((candidate) => candidate.id)),
  );
  const otherParameters = parameters.filter((candidate) => !groupedParameterIds.has(candidate.id));

  if (otherParameters.length > 0) {
    return [...familyOptions, { name: "Otros", parameters: otherParameters }];
  }

  return familyOptions;
}

function parameterBelongsToFamily(parameter: Parameter, familyName: string): boolean {
  if (familyName === "Otros") {
    return getParameterFamilyNames(parameter).length === 0;
  }
  const family = LEGACY_PARAMETER_FAMILIES.find((candidate) => candidate.name === familyName);
  if (!family) {
    return false;
  }
  const keys = [parameter.code, parameter.name].map(normalizeFilterText);
  return family.terms.some((term) => {
    const normalizedTerm = normalizeFilterText(term);
    return keys.some((key) => {
      if (normalizedTerm.length <= 2) {
        return key === normalizedTerm;
      }
      return key === normalizedTerm || key.includes(normalizedTerm);
    });
  });
}

function getParameterFamilyNames(parameter: Parameter): string[] {
  return LEGACY_PARAMETER_FAMILIES.filter((family) =>
    parameterBelongsToFamily(parameter, family.name),
  ).map((family) => family.name);
}

function getParameterSearchTerms(parameter: Parameter) {
  const familyTerms = LEGACY_PARAMETER_FAMILIES.filter((family) =>
    parameterBelongsToFamily(parameter, family.name),
  ).flatMap((family) => [family.name, ...family.terms]);
  return [parameter.code, parameter.name, ...familyTerms];
}

function materialHasValueInFamily(
  material: RawMaterial,
  parameters: Parameter[],
  familyName: string,
) {
  return parameters.some((candidate) => {
    if (!parameterBelongsToFamily(candidate, familyName)) {
      return false;
    }
    const value = material.parameters[candidate.code]?.value ?? 0;
    return Math.abs(value) > 0.0001;
  });
}

function formatPrice(material: RawMaterial) {
  if (material.price === null) {
    return "-";
  }
  return `${material.price.toFixed(4)} ${material.priceCurrency ?? "EUR"}/${
    material.priceUnit ?? "kg"
  }`;
}

function formatParameterValue(parameter: RawMaterial["parameters"][string]) {
  return `${parameter.code}: ${parameter.value.toFixed(4)}${parameter.unit ? ` ${parameter.unit}` : ""}`;
}

function formatDate(value: string) {
  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = calendarDate
    ? new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3]))
    : new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
  }).format(date);
}

function formatImportAction(action: string) {
  return action.replace(/_/g, " ");
}

function buildParameterDrafts(material: RawMaterial, parameters: Parameter[]) {
  return Object.fromEntries(
    parameters.map((candidate) => [
      candidate.id,
      String(material.parameters[candidate.code]?.value ?? 0),
    ]),
  );
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDraftNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFilterText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
