"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../supabase-client";

type ResetMode = "idle" | "working" | "sent" | "error";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<ResetMode>("idle");
  const [message, setMessage] = useState(
    "Introduce tu email invitado para crear o recuperar tu contrasena.",
  );

  async function sendResetLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setStatus("error");
      setMessage("Introduce un email valido.");
      return;
    }

    setStatus("working");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Revisa tu email para continuar y crear una nueva contrasena.");
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
        <h1>Contrasena</h1>
        <p>Usa este flujo solo si ya has sido invitado al tenant.</p>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void sendResetLink();
              }
            }}
          />
        </label>
        <div className="loginActions">
          <button
            className="primaryButton"
            type="button"
            onClick={sendResetLink}
            disabled={status === "working"}
          >
            {status === "working" ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />}
            Enviar recuperacion
          </button>
          <a className="textLink" href="/login">
            Volver a login
          </a>
        </div>
        <div className="statusLine" data-state={status === "error" ? "error" : "idle"}>
          <span>{message}</span>
        </div>
      </section>
    </main>
  );
}
