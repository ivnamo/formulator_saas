import {
  AlertTriangle,
  BrainCircuit,
  ChevronDown,
  ClipboardCheck,
  Database,
  FlaskConical,
  FolderOpen,
  KeyRound,
  LogOut,
  RefreshCw,
  Settings2,
  Upload,
  UserCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Status } from "./workspace-base-model";
import type { WorkspaceState } from "./workspace-state-model";

export type WorkspaceView =
  | "formula"
  | "iso"
  | "materials"
  | "import"
  | "results"
  | "settings"
  | "library"
  | "compatibility"
  | "ai";

const VIEW_TITLES: Record<WorkspaceView, string> = {
  formula: "Formula Builder",
  iso: "ISO 9001",
  materials: "Materias primas",
  import: "Importar Excel",
  results: "Resultados",
  settings: "Configuracion",
  library: "Biblioteca",
  compatibility: "Compatibilidad",
  ai: "Asistente IA",
};

const VIEW_DESCRIPTIONS: Record<WorkspaceView, string> = {
  formula: "Mesa unica para formular, calcular, guardar y enviar a revision.",
  iso: "Registros F10-01, F10-02 y F10-03 por tenant.",
  materials: "Consulta y crea materias primas para formular.",
  import: "Sube formulas historicas y resuelve coincidencias.",
  results: "Vista legacy de resultados calculados.",
  settings: "Configura workspace, parametros e integraciones.",
  library: "Abre formulas guardadas y compara escenarios.",
  compatibility: "Gestiona reglas manuales de compatibilidad.",
  ai: "Convierte requisitos en restricciones y borradores revisables.",
};

type AppShellProps = {
  activeView: WorkspaceView;
  workspace: WorkspaceState;
  sessionEmail: string | undefined;
  status: Status;
  message: string;
  isBusy: boolean;
  children: ReactNode;
  onViewChange: (view: WorkspaceView) => void;
  onSignOut: () => void | Promise<void>;
};

type NavigationItem = {
  view: WorkspaceView;
  label: string;
  icon: ReactNode;
};

const primaryNavigation: NavigationItem[] = [
  { view: "formula", label: "Formula actual", icon: <FlaskConical size={18} /> },
  { view: "iso", label: "ISO 9001", icon: <ClipboardCheck size={18} /> },
  { view: "materials", label: "Materias primas", icon: <Database size={18} /> },
  { view: "import", label: "Importar Excel", icon: <Upload size={18} /> },
  { view: "settings", label: "Configuracion", icon: <Settings2 size={18} /> },
];

const advancedNavigation: NavigationItem[] = [
  { view: "library", label: "Biblioteca", icon: <FolderOpen size={18} /> },
  { view: "compatibility", label: "Compatibilidad", icon: <AlertTriangle size={18} /> },
  { view: "ai", label: "Asistente IA", icon: <BrainCircuit size={18} /> },
];

export function AppShell({
  activeView,
  workspace,
  sessionEmail,
  status,
  message,
  isBusy,
  children,
  onViewChange,
  onSignOut,
}: AppShellProps) {
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
          {primaryNavigation.map((item) => (
            <button
              className={`navItem ${activeView === item.view ? "active" : ""}`}
              key={item.view}
              type="button"
              onClick={() => onViewChange(item.view)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <details className="navDisclosure">
            <summary>Herramientas avanzadas</summary>
            {advancedNavigation.map((item) => (
              <button
                className={`navItem ${activeView === item.view ? "active" : ""}`}
                key={item.view}
                type="button"
                onClick={() => onViewChange(item.view)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </details>
        </nav>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div>
            <h1>{VIEW_TITLES[activeView]}</h1>
            <p>
              {workspace.tenant
                ? `${workspace.formulaName} - ${VIEW_DESCRIPTIONS[activeView]} - ${workspace.tenant.name}`
                : VIEW_DESCRIPTIONS[activeView]}
            </p>
          </div>
          <details className="accountMenu">
            <summary>
              <span className="accountAvatar">
                <UserCircle size={20} />
              </span>
              <span className="accountIdentity">
                <strong>{sessionEmail ?? "Sesion activa"}</strong>
                <small>{workspace.tenant?.role ?? "sin rol"}</small>
              </span>
              <ChevronDown size={15} />
            </summary>
            <div className="accountMenuPanel">
              <button
                className="accountMenuItem"
                type="button"
                onClick={() => onViewChange("settings")}
              >
                <Settings2 size={16} />
                Cuenta y workspace
              </button>
              <a className="accountMenuItem" href="/update-password">
                <KeyRound size={16} />
                Cambiar contrasena
              </a>
              <button
                className="accountMenuItem danger"
                type="button"
                onClick={onSignOut}
                disabled={isBusy}
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </details>
        </header>

        <div className="statusLine" data-state={status}>
          {status === "error" ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
          <span>{message}</span>
        </div>

        {children}
      </section>
    </main>
  );
}
