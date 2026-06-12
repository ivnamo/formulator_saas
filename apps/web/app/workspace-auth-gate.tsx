import { Loader2 } from "lucide-react";

export function WorkspaceAuthGate() {
  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="brand">
          <div className="brandMark">F</div>
          <div>
            <strong>FormulIA Cloud</strong>
            <span>Acceso seguro</span>
          </div>
        </div>
        <div className="statusLine">
          <Loader2 className="spin" size={16} />
          <span>Validando sesion</span>
        </div>
      </section>
    </main>
  );
}
