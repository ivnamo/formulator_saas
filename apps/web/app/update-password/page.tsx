"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import { getSupabaseBrowserClient } from "../supabase-client";

type PasswordMode = "idle" | "working" | "success" | "error";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<PasswordMode>("idle");
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState("Introduce una nueva contrasena.");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      if (!data.session) {
        setStatus("error");
        setMessage("Abre esta pantalla desde el enlace de recuperacion recibido por email.");
      }
    });
  }, []);

  async function updatePassword() {
    if (!hasSession) {
      setStatus("error");
      setMessage("Abre esta pantalla desde el enlace de recuperacion recibido por email.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setStatus("error");
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    setStatus("working");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("success");
    setMessage("Contrasena actualizada. Ya puedes continuar.");
    window.setTimeout(() => {
      window.location.href = "/";
    }, 900);
  }

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
        <h1>Nueva contrasena</h1>
        <p>Esta accion actualiza la contrasena de tu usuario Supabase.</p>
        <label>
          <span>Nueva contrasena</span>
          <input
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          <span>Confirmar contrasena</span>
          <input
            autoComplete="new-password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void updatePassword();
              }
            }}
          />
        </label>
        <div className="loginActions">
          <button
            className="primaryButton"
            type="button"
            onClick={updatePassword}
            disabled={status === "working" || status === "success"}
          >
            {status === "working" ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            Guardar contrasena
          </button>
          <a className="textLink" href="/login">
            <KeyRound size={16} />
            Ir a login
          </a>
        </div>
        <div className="statusLine" data-state={status === "error" ? "error" : "idle"}>
          <span>{message}</span>
        </div>
      </section>
    </main>
  );
}
