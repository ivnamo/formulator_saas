"use client";

import {
  AlertTriangle,
  Beaker,
  Calculator,
  Database,
  FlaskConical,
  FolderOpen,
  History,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { apiUrl, request, userId } from "./workspace-api";
import {
  emptyWorkspace,
  formatDateTime,
  makeLocalId,
  normalizeCode,
  parseOptionalNumber,
  slugify,
  type CalculationResult,
  type ExcelImportPreview,
  type FormulaCalculationHistory,
  type FormulaRead,
  type MaterialForm,
  type ParameterRead,
  type RawMaterialRead,
  type Status,
  type TenantRead,
  type WorkspaceState,
} from "./workspace-model";

export default function Home() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [workspaceName, setWorkspaceName] = useState("Workspace Lab");
  const [parameterForm, setParameterForm] = useState({
    code: "active_content",
    name: "Active content",
    unit: "% p/p",
  });
  const [materialForm, setMaterialForm] = useState<MaterialForm>({
    code: "",
    name: "",
    price: "",
    parameterValue: "",
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [formulas, setFormulas] = useState<FormulaRead[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<FormulaCalculationHistory[]>([]);
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [workspace.tenant],
  );
  const uploadHeaders = useMemo(
    () => ({
      "X-User-Id": userId,
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [workspace.tenant],
  );

  const rawMaterialsById = useMemo(
    () => new Map(workspace.rawMaterials.map((material) => [material.id, material])),
    [workspace.rawMaterials],
  );
  const totalPercentage = workspace.formulaLines.reduce(
    (sum, line) => sum + line.percentage,
    0,
  );
  const isBusy = status === "working";
  const canEditTenantData = Boolean(workspace.tenant) && !isBusy;
  const canCalculate = Boolean(workspace.tenant) && workspace.formulaLines.length > 0 && !isBusy;
  const canSaveImport =
    Boolean(importPreview) &&
    importPreview?.rows.length !== 0 &&
    importPreview?.pending_rows === 0 &&
    !isBusy;

  async function createWorkspace() {
    await runAction("Creating workspace", async () => {
      const name = workspaceName.trim() || "Workspace Lab";
      const tenant = await request<TenantRead>("/api/v1/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({
          name,
          slug: `${slugify(name)}-${Date.now()}`,
        }),
      });
      setWorkspace({
        ...emptyWorkspace,
        tenant,
        formulaName: `${name} Formula`,
      });
      setResult(null);
      setFormulas([]);
      setCalculationHistory([]);
      setImportPreview(null);
      setImportFileName("");
      setMessage("Workspace ready");
    });
  }

  async function createParameter() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!parameterForm.code.trim() || !parameterForm.name.trim() || !parameterForm.unit.trim()) {
      setError("Parameter code, name and unit are required");
      return;
    }

    await runAction("Creating parameter", async () => {
      const parameter = await request<ParameterRead>("/api/v1/parameters", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: normalizeCode(parameterForm.code),
          name: parameterForm.name.trim(),
          unit: parameterForm.unit.trim(),
        }),
      });
      setWorkspace((current) => ({
        ...current,
        parameter,
      }));
      setResult(null);
      setMessage("Parameter ready");
    });
  }

  async function createMaterial() {
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

      setWorkspace((current) => ({
        ...current,
        rawMaterials: [
          ...current.rawMaterials,
          {
            id: material.id,
            code: material.code,
            name: material.name,
            price,
            parameterValue: workspace.parameter ? parameterValue : null,
          },
        ],
      }));
      setMaterialForm({ code: "", name: "", price: "", parameterValue: "" });
      setResult(null);
      setImportPreview(null);
      setMessage("Raw material ready");
    });
  }

  function addFormulaLine(rawMaterialId: string) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: [
        ...current.formulaLines,
        { localId: makeLocalId(), rawMaterialId, percentage: 0 },
      ],
    }));
    setResult(null);
  }

  function removeFormulaLine(localId: string) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.filter((line) => line.localId !== localId),
    }));
    setResult(null);
  }

  function updateFormulaLine(localId: string, percentage: number) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.map((line) =>
        line.localId === localId ? { ...line, percentage } : line,
      ),
    }));
    setResult(null);
  }

  async function calculateFormula() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!workspace.formulaLines.length) {
      setError("Add at least one formula line");
      return;
    }

    await runAction("Calculating formula", async () => {
      const items = workspace.formulaLines.map((line, index) => ({
        raw_material_id: line.rawMaterialId,
        percentage: line.percentage,
        order_index: index,
      }));
      const payload = {
        name: workspace.formulaName.trim() || "Manual Formula",
        items,
      };
      const formula = workspace.formulaId
        ? await request<FormulaRead>(`/api/v1/formulas/${workspace.formulaId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        : await request<FormulaRead>("/api/v1/formulas", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
      const calculation = await request<CalculationResult>(
        `/api/v1/formulas/${formula.id}/calculate`,
        { method: "POST", headers },
      );
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
      }));
      setResult(calculation);
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setMessage("Calculation complete");
    });
  }

  async function refreshFormulaLibrary(options: { silent?: boolean } = {}) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (options.silent) {
      const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
        method: "GET",
        headers,
      });
      setFormulas(nextFormulas);
      return;
    }
    await runAction("Refreshing formula library", async () => {
      const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
        method: "GET",
        headers,
      });
      setFormulas(nextFormulas);
      setMessage("Formula library refreshed");
    });
  }

  async function openFormula(formula: FormulaRead) {
    await runAction("Opening formula", async () => {
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
        formulaLines: formula.items.map((item) => ({
          localId: makeLocalId(),
          rawMaterialId: item.raw_material_id,
          percentage: item.percentage,
        })),
      }));
      setResult(null);
      setImportPreview(null);
      setImportFileName("");
      await loadCalculationHistory(formula.id);
      setMessage("Formula opened");
    });
  }

  async function loadCalculationHistory(formulaId: string) {
    const history = await request<FormulaCalculationHistory[]>(
      `/api/v1/formulas/${formulaId}/calculations`,
      { method: "GET", headers },
    );
    setCalculationHistory(history);
  }

  async function previewExcelImport(file: File | null) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!file) {
      return;
    }
    await runAction("Reading Excel file", async () => {
      const formData = new FormData();
      formData.append("file", file);
      const preview = await request<ExcelImportPreview>(
        "/api/v1/imports/formulas/excel/preview",
        {
          method: "POST",
          headers: uploadHeaders,
          body: formData,
        },
      );
      setImportPreview(preview);
      setImportFileName(file.name);
      setMessage("Import preview ready");
    });
  }

  async function saveExcelImport() {
    if (!workspace.tenant || !importPreview) {
      setError("Preview an Excel file first");
      return;
    }
    if (importPreview.pending_rows > 0) {
      setError("Resolve import rows before saving");
      return;
    }

    await runAction("Saving imported formula", async () => {
      const formula = await request<FormulaRead>("/api/v1/imports/formulas/excel/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: `${workspace.tenant?.name ?? "Imported"} Excel Formula`,
          rows: importPreview.rows.map((row) => ({
            raw_material_id: row.raw_material_id,
            percentage: row.percentage,
          })),
        }),
      });
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
        formulaLines: formula.items.map((item) => ({
          localId: makeLocalId(),
          rawMaterialId: item.raw_material_id,
          percentage: item.percentage,
        })),
      }));
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setResult(null);
      setMessage("Imported formula saved");
    });
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setStatus("working");
    setMessage(label);
    try {
      await action();
      setStatus("idle");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed");
    }
  }

  function setError(nextMessage: string) {
    setStatus("error");
    setMessage(nextMessage);
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <div className="brandMark">F</div>
          <div>
            <strong>FormulIA Cloud</strong>
            <span>Platform</span>
          </div>
        </div>
        <nav className="nav">
          <a className="navItem active" href="#workspace">
            <FlaskConical size={18} /> Workspace
          </a>
          <a className="navItem" href="#materials">
            <Database size={18} /> Materials
          </a>
          <a className="navItem" href="#library">
            <FolderOpen size={18} /> Library
          </a>
          <a className="navItem" href="#parameters">
            <Settings2 size={18} /> Parameters
          </a>
          <a className="navItem" href="#import">
            <Upload size={18} /> Import
          </a>
          <a className="navItem" href="#results">
            <ListChecks size={18} /> Results
          </a>
        </nav>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div>
            <h1>{workspace.formulaName}</h1>
            <p>
              {workspace.tenant
                ? `${workspace.tenant.name} - ${workspace.tenant.id}`
                : "No workspace active"}
            </p>
          </div>
          <div className="actions">
            <button className="primaryButton" type="button" onClick={calculateFormula} disabled={!canCalculate}>
              {isBusy ? <Loader2 className="spin" size={17} /> : <Calculator size={17} />}
              Calculate
            </button>
          </div>
        </header>

        <div className="statusLine" data-state={status}>
          {status === "error" ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
          <span>{message}</span>
          <code>{apiUrl}</code>
        </div>

        <div className="grid">
          <section className="panel setupPanel">
            <div className="panelHeader">
              <h2>Workspace</h2>
              <span>{workspace.tenant ? "Active" : "New"}</span>
            </div>
            <div className="formGrid">
              <label>
                <span>Name</span>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  disabled={isBusy}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createWorkspace} disabled={isBusy}>
                <Plus size={17} />
                Create workspace
              </button>
            </div>
          </section>

          <section id="parameters" className="panel setupPanel">
            <div className="panelHeader">
              <h2>Parameter</h2>
              <span>{workspace.parameter ? workspace.parameter.code : "None"}</span>
            </div>
            <div className="formGrid threeColumns">
              <label>
                <span>Code</span>
                <input
                  value={parameterForm.code}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, code: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={parameterForm.name}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Unit</span>
                <input
                  value={parameterForm.unit}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, unit: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createParameter} disabled={!canEditTenantData}>
                <Save size={17} />
                Save parameter
              </button>
            </div>
          </section>

          <section id="materials" className="panel materialPanel">
            <div className="panelHeader">
              <h2>Raw materials</h2>
              <span>{workspace.rawMaterials.length} rows</span>
            </div>
            <div className="materialForm">
              <label>
                <span>Code</span>
                <input
                  value={materialForm.code}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, code: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={materialForm.name}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, name: event.target.value }))
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
                    setMaterialForm((current) => ({ ...current, price: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>{workspace.parameter ? workspace.parameter.name : "Value"}</span>
                <input
                  inputMode="decimal"
                  value={materialForm.parameterValue}
                  onChange={(event) =>
                    setMaterialForm((current) => ({
                      ...current,
                      parameterValue: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || !workspace.parameter}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createMaterial} disabled={!canEditTenantData}>
                <Plus size={17} />
                Add material
              </button>
            </div>
            <div className="materialTable">
              <div className="materialHead">
                <span>Code</span>
                <span>Name</span>
                <span>Price</span>
                <span>{workspace.parameter?.code ?? "Parameter"}</span>
                <span>Formula</span>
              </div>
              {workspace.rawMaterials.length === 0 ? (
                <div className="empty">No raw materials yet.</div>
              ) : (
                workspace.rawMaterials.map((material) => (
                  <div className="materialRow" key={material.id}>
                    <code>{material.code || "-"}</code>
                    <span>{material.name}</span>
                    <span>{material.price === null ? "-" : material.price.toFixed(2)}</span>
                    <span>{material.parameterValue === null ? "-" : material.parameterValue.toFixed(2)}</span>
                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => addFormulaLine(material.id)}
                      disabled={isBusy}
                      title="Add to formula"
                      aria-label={`Add ${material.name} to formula`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="library" className="panel libraryPanel">
            <div className="panelHeader">
              <h2>Formula library</h2>
              <span>{formulas.length} formulas</span>
            </div>
            <div className="libraryActions">
              <button
                className="secondaryButton"
                type="button"
                onClick={() => refreshFormulaLibrary()}
                disabled={!canEditTenantData}
              >
                <RefreshCw size={17} />
                Refresh library
              </button>
            </div>
            <div className="libraryGrid">
              <div className="formulaList">
                <div className="formulaListHead">
                  <span>Name</span>
                  <span>Price</span>
                  <span>Lines</span>
                  <span>Open</span>
                </div>
                {formulas.length === 0 ? (
                  <div className="empty">No saved formulas yet.</div>
                ) : (
                  formulas.map((formula) => (
                    <div className="formulaListRow" key={formula.id}>
                      <span>{formula.name}</span>
                      <span>
                        {formula.total_price === null
                          ? "-"
                          : `${formula.total_price.toFixed(2)} ${formula.currency}/kg`}
                      </span>
                      <span>{formula.items.length}</span>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => openFormula(formula)}
                        disabled={isBusy}
                        title="Open formula"
                        aria-label={`Open ${formula.name}`}
                      >
                        <FolderOpen size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="historyList">
                <div className="historyTitle">
                  <History size={17} />
                  <strong>Calculation history</strong>
                </div>
                {calculationHistory.length === 0 ? (
                  <div className="empty">No calculations yet.</div>
                ) : (
                  calculationHistory.map((entry) => (
                    <div className="historyRow" key={entry.id}>
                      <span>{formatDateTime(entry.calculated_at)}</span>
                      <strong>
                        {entry.price_total === null
                          ? "-"
                          : `${entry.price_total.toFixed(2)} ${entry.result_json.currency}/kg`}
                      </strong>
                      <span>
                        {entry.result_json.total_percentage.toFixed(1)}% ·{" "}
                        {entry.result_json.warnings.length} warnings
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section id="import" className="panel importPanel">
            <div className="panelHeader">
              <h2>Excel import</h2>
              <span>{importPreview ? importPreview.sheet_name : "No file"}</span>
            </div>
            <div className="importActions">
              <label>
                <span>Upload .xlsx</span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => previewExcelImport(event.target.files?.[0] ?? null)}
                  disabled={!canEditTenantData}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={saveExcelImport} disabled={!canSaveImport}>
                <Save size={17} />
                Save formula
              </button>
            </div>
            <div className="importSummary">
              <div>
                <span>File</span>
                <strong>{importFileName || "-"}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{importPreview ? `${importPreview.total_percentage.toFixed(1)}%` : "-"}</strong>
              </div>
              <div>
                <span>Resolved</span>
                <strong>{importPreview ? importPreview.resolved_rows : "-"}</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>{importPreview ? importPreview.pending_rows : "-"}</strong>
              </div>
            </div>
            <div className="importTable">
              <div className="importHead">
                <span>Row</span>
                <span>Material</span>
                <span>Share</span>
                <span>Status</span>
              </div>
              {importPreview ? (
                importPreview.rows.map((row) => (
                  <div className="importRow" key={row.row_number}>
                    <code>{row.row_number}</code>
                    <span>{row.material_code || row.material_name || "-"}</span>
                    <span>{row.percentage === null ? "-" : `${row.percentage.toFixed(2)}%`}</span>
                    <span data-state={row.status}>{row.status}</span>
                  </div>
                ))
              ) : (
                <div className="empty">No import preview.</div>
              )}
            </div>
          </section>

          <section id="formula" className="panel formulaPanel">
            <div className="panelHeader">
              <h2>Formula</h2>
              <span>{totalPercentage.toFixed(1)}%</span>
            </div>
            <label className="fullWidthLabel">
              <span>Name</span>
              <input
                value={workspace.formulaName}
                onChange={(event) =>
                  setWorkspace((current) => ({ ...current, formulaName: event.target.value }))
                }
                disabled={isBusy}
              />
            </label>
            <div className="formulaMeter" aria-label="Formula percentage total">
              <div style={{ width: `${Math.min(Math.max(totalPercentage, 0), 100)}%` }} />
            </div>
            <div className="formulaSummary">
              <div>
                <span>Total percentage</span>
                <strong>{totalPercentage.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{totalPercentage === 100 ? "Balanced" : "Draft"}</strong>
              </div>
              <div>
                <span>Calculation source</span>
                <strong>Backend</strong>
              </div>
            </div>
            <div className="formulaLines">
              {workspace.formulaLines.length === 0 ? (
                <div className="empty">Add materials to build a formula.</div>
              ) : (
                workspace.formulaLines.map((line) => {
                  const material = rawMaterialsById.get(line.rawMaterialId);
                  return (
                    <div className="formulaLine" key={line.localId}>
                      <span>{material?.name ?? "Unknown material"}</span>
                      <input
                        aria-label={`${material?.name ?? "Material"} percentage`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={line.percentage}
                        onChange={(event) =>
                          updateFormulaLine(line.localId, Number(event.target.value))
                        }
                        disabled={isBusy}
                      />
                      <button
                        className="iconButton danger"
                        type="button"
                        onClick={() => removeFormulaLine(line.localId)}
                        disabled={isBusy}
                        title="Remove line"
                        aria-label={`Remove ${material?.name ?? "material"} from formula`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section id="results" className="panel resultPanel">
            <div className="panelHeader">
              <h2>Calculation results</h2>
              <span>{result ? result.currency : "Pending"}</span>
            </div>
            <div className="resultStats">
              <div>
                <span>Total price</span>
                <strong>
                  {result?.price_total == null
                    ? "-"
                    : `${result.price_total.toFixed(2)} ${result.currency}/kg`}
                </strong>
              </div>
              <div>
                <span>Total percentage</span>
                <strong>{result ? `${result.total_percentage.toFixed(1)}%` : "-"}</strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>{result?.warnings.length ?? 0}</strong>
              </div>
            </div>
            <div className="parameterList">
              {result?.parameters.length ? (
                result.parameters.map((parameter) => (
                  <div key={parameter.code}>
                    <Beaker size={18} />
                    <span>{parameter.code}</span>
                    <code>
                      {parameter.value.toFixed(2)} {parameter.unit ?? ""}
                    </code>
                  </div>
                ))
              ) : (
                <div>
                  <Beaker size={18} />
                  <span>No calculated parameters</span>
                  <code>-</code>
                </div>
              )}
            </div>
            <div className="warningList">
              {result?.warnings.length ? (
                result.warnings.map((warning) => (
                  <div key={`${warning.code}-${warning.raw_material_id ?? ""}-${warning.parameter_code ?? ""}`}>
                    <AlertTriangle size={16} />
                    <span>{warning.message}</span>
                  </div>
                ))
              ) : (
                <div>No warnings</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
