import {
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  History,
  Plus,
  Save,
  Search,
  Upload,
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
  materialForm: MaterialForm;
  aliasInputs: Record<string, string>;
  canEditTenantData: boolean;
  isBusy: boolean;
  onMaterialFormChange: Dispatch<SetStateAction<MaterialForm>>;
  onAliasInputsChange: Dispatch<SetStateAction<Record<string, string>>>;
  onCreateMaterial: () => void | Promise<void>;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
  onCreateAlias: (rawMaterialId: string) => void | Promise<void>;
  onUpdateMaterial: (
    rawMaterialId: string,
    form: RawMaterialUpdateForm,
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
  materialForm,
  aliasInputs,
  canEditTenantData,
  isBusy,
  onMaterialFormChange,
  onAliasInputsChange,
  onCreateMaterial,
  onAddFormulaLine,
  onCreateAlias,
  onUpdateMaterial,
  onLoadMaterialPriceHistory,
  onAddMaterialPrice,
  onPreviewSapImport,
  onApplySapImport,
}: RawMaterialsPanelProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>("all");
  const [priceFilter, setPriceFilter] = useState<MaterialPriceFilter>("all");
  const [sapFilter, setSapFilter] = useState<MaterialSapFilter>("all");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RawMaterialUpdateForm | null>(null);
  const [priceForm, setPriceForm] = useState<RawMaterialPriceForm>(emptyPriceForm);
  const [priceHistory, setPriceHistory] = useState<RawMaterialPriceRead[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [sapFile, setSapFile] = useState<File | null>(null);
  const [sapForm, setSapForm] = useState<SapRawMaterialImportForm>(createDefaultSapForm);
  const [sapPreview, setSapPreview] = useState<RawMaterialImportRead | null>(null);
  const [sapNotice, setSapNotice] = useState("");

  const summary = useMemo(() => buildMaterialSummary(rawMaterials), [rawMaterials]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
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
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
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
      return true;
    });
  }, [priceFilter, query, rawMaterials, sapFilter, statusFilter]);

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
    setSelectedMaterialId(rawMaterials[0]?.id ?? null);
  }, [rawMaterials, selectedMaterialId]);

  useEffect(() => {
    setEditForm(selectedMaterial ? buildRawMaterialUpdateForm(selectedMaterial) : null);
    setPriceForm(emptyPriceForm);
  }, [selectedMaterial]);

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

      <div className="materialToolbar">
        <label>
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
      </div>

      <div className="materialMasterGrid">
        <div className="materialTable">
          <div className="materialHead materialMasterHead">
            <span>Code</span>
            <span>SAP</span>
            <span>Name</span>
            <span>Family</span>
            <span>Price</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {filteredMaterials.length === 0 ? (
            <div className="empty">No raw materials match these filters.</div>
          ) : (
            filteredMaterials.map((material) => (
              <div
                className="materialRow materialMasterRow"
                data-selected={selectedMaterialId === material.id}
                key={material.id}
              >
                <code>{material.code || "-"}</code>
                <code>{material.externalCode || "-"}</code>
                <strong>{material.name}</strong>
                <span>{material.family || "-"}</span>
                <span>{formatPrice(material)}</span>
                <span>
                  <StatusPill material={material} />
                </span>
                <span className="rowActions">
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => setSelectedMaterialId(material.id)}
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
                </span>
              </div>
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

function formatPrice(material: RawMaterial) {
  if (material.price === null) {
    return "-";
  }
  return `${material.price.toFixed(4)} ${material.priceCurrency ?? "EUR"}/${
    material.priceUnit ?? "kg"
  }`;
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
