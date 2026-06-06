"use client";

import {
  AlertTriangle,
  Beaker,
  Calculator,
  Database,
  FlaskConical,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";

type ApiState = {
  tenantId?: string;
  parameterId?: string;
  rawMaterials: Array<{ id: string; name: string; code: string; percentage: number }>;
  formulaId?: string;
};

type CalculationResult = {
  total_percentage: number;
  price_total: number | null;
  currency: string;
  parameters: Array<{ code: string; value: number; unit: string | null }>;
  warnings: Array<{ code: string; message: string }>;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const userId = "10000000-0000-0000-0000-000000000001";

export default function Home() {
  const [apiState, setApiState] = useState<ApiState>({ rawMaterials: [] });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "seeding" | "calculating" | "error">("idle");
  const [message, setMessage] = useState("Ready");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...(apiState.tenantId ? { "X-Tenant-Id": apiState.tenantId } : {}),
    }),
    [apiState.tenantId],
  );

  async function seedWorkspace() {
    setStatus("seeding");
    setMessage("Creating tenant workspace");
    setResult(null);

    try {
      const tenantSlug = `demo-${Date.now()}`;
      const tenant = await request<{ id: string }>("/api/v1/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({ name: "Demo Lab", slug: tenantSlug }),
      });
      const tenantHeaders = {
        "Content-Type": "application/json",
        "X-User-Id": userId,
        "X-Tenant-Id": tenant.id,
      };
      const parameter = await request<{ id: string }>("/api/v1/parameters", {
        method: "POST",
        headers: tenantHeaders,
        body: JSON.stringify({
          code: "active_content",
          name: "Active content",
          unit: "% p/p",
        }),
      });
      const active = await createRawMaterial(tenantHeaders, {
        name: "Active A",
        code: "ACT-A",
        price: 2,
        parameterId: parameter.id,
        parameterValue: 40,
      });
      const carrier = await createRawMaterial(tenantHeaders, {
        name: "Carrier B",
        code: "CAR-B",
        price: 1,
        parameterId: parameter.id,
        parameterValue: 10,
      });
      const rawMaterials = [
        { ...active, percentage: 25 },
        { ...carrier, percentage: 75 },
      ];
      const formula = await request<{ id: string }>("/api/v1/formulas", {
        method: "POST",
        headers: tenantHeaders,
        body: JSON.stringify({
          name: "Foundation Formula",
          items: rawMaterials.map((material) => ({
            raw_material_id: material.id,
            percentage: material.percentage,
          })),
        }),
      });

      setApiState({
        tenantId: tenant.id,
        parameterId: parameter.id,
        rawMaterials,
        formulaId: formula.id,
      });
      setStatus("idle");
      setMessage("Workspace seeded");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not seed workspace");
    }
  }

  async function calculate() {
    if (!apiState.tenantId || !apiState.formulaId) {
      setStatus("error");
      setMessage("Seed a workspace first");
      return;
    }

    setStatus("calculating");
    setMessage("Calculating in backend");

    try {
      await request(`/api/v1/formulas/${apiState.formulaId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          items: apiState.rawMaterials.map((material) => ({
            raw_material_id: material.id,
            percentage: material.percentage,
          })),
        }),
      });
      const calculation = await request<CalculationResult>(
        `/api/v1/formulas/${apiState.formulaId}/calculate`,
        { method: "POST", headers },
      );
      setResult(calculation);
      setStatus("idle");
      setMessage("Calculation complete");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Calculation failed");
    }
  }

  function updatePercentage(id: string, percentage: number) {
    setApiState((current) => ({
      ...current,
      rawMaterials: current.rawMaterials.map((material) =>
        material.id === id ? { ...material, percentage } : material,
      ),
    }));
  }

  const isBusy = status === "seeding" || status === "calculating";
  const totalPercentage = apiState.rawMaterials.reduce(
    (sum, material) => sum + material.percentage,
    0,
  );

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
          <a className="navItem active" href="#formula">
            <FlaskConical size={18} /> Formula
          </a>
          <a className="navItem" href="#materials">
            <Database size={18} /> Raw materials
          </a>
          <a className="navItem" href="#parameters">
            <Settings2 size={18} /> Parameters
          </a>
          <a className="navItem" href="#results">
            <ListChecks size={18} /> Results
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Foundation Formula</h1>
            <p>{apiState.tenantId ? `Tenant ${apiState.tenantId}` : "No tenant seeded"}</p>
          </div>
          <div className="actions">
            <button className="secondaryButton" type="button" onClick={seedWorkspace} disabled={isBusy}>
              {status === "seeding" ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}
              Seed demo
            </button>
            <button className="primaryButton" type="button" onClick={calculate} disabled={isBusy}>
              {status === "calculating" ? <Loader2 className="spin" size={17} /> : <Calculator size={17} />}
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
          <section id="materials" className="panel">
            <div className="panelHeader">
              <h2>Raw materials</h2>
              <span>{apiState.rawMaterials.length || 0} rows</span>
            </div>
            <div className="table">
              <div className="tableHead">
                <span>Code</span>
                <span>Name</span>
                <span>Share</span>
              </div>
              {apiState.rawMaterials.length === 0 ? (
                <div className="empty">Seed demo data to create the first materials.</div>
              ) : (
                apiState.rawMaterials.map((material) => (
                  <div className="tableRow" key={material.id}>
                    <code>{material.code}</code>
                    <span>{material.name}</span>
                    <input
                      aria-label={`${material.name} percentage`}
                      type="number"
                      value={material.percentage}
                      min={0}
                      max={100}
                      step={0.1}
                      onChange={(event) =>
                        updatePercentage(material.id, Number(event.target.value))
                      }
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="formula" className="panel formulaPanel">
            <div className="panelHeader">
              <h2>Formula</h2>
              <span>{totalPercentage}%</span>
            </div>
            <div className="formulaMeter" aria-label="Formula percentage total">
              <div style={{ width: `${Math.min(totalPercentage, 100)}%` }} />
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
          </section>

          <section id="parameters" className="panel">
            <div className="panelHeader">
              <h2>Parameters</h2>
              <span>Tenant scoped</span>
            </div>
            <div className="parameterList">
              <div>
                <Beaker size={18} />
                <span>Active content</span>
                <code>% p/p</code>
              </div>
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
                <span>Active content</span>
                <strong>
                  {result?.parameters[0]
                    ? `${result.parameters[0].value.toFixed(2)} ${result.parameters[0].unit ?? ""}`
                    : "-"}
                </strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>{result?.warnings.length ?? 0}</strong>
              </div>
            </div>
            <div className="warningList">
              {result?.warnings.length ? (
                result.warnings.map((warning) => (
                  <div key={`${warning.code}-${warning.message}`}>
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

async function createRawMaterial(
  headers: HeadersInit,
  payload: {
    name: string;
    code: string;
    price: number;
    parameterId: string;
    parameterValue: number;
  },
) {
  const material = await request<{ id: string; name: string; code: string }>(
    "/api/v1/raw-materials",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: payload.name, code: payload.code }),
    },
  );
  await request(`/api/v1/raw-materials/${material.id}/prices`, {
    method: "POST",
    headers,
    body: JSON.stringify({ price: payload.price, currency: "EUR", unit: "kg" }),
  });
  await request(`/api/v1/raw-materials/${material.id}/parameter-values`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      parameter_id: payload.parameterId,
      value: payload.parameterValue,
    }),
  });
  return material;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}
