"use client";

import { useState } from "react";
import { KeyRound, Loader2, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "../supabase-client";

type LoginMode = "idle" | "working" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginMode>("idle");
  const [message, setMessage] = useState("Introduce tu email invitado y contrasena.");

  async function signInWithPassword() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@") || password.length === 0) {
      setStatus("error");
      setMessage("Email y contrasena son obligatorios.");
      return;
    }

    setStatus("working");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    window.location.href = next;
  }

  async function signInWithEmail() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setStatus("error");
      setMessage("Introduce un email valido.");
      return;
    }

    setStatus("working");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Revisa tu email para entrar en FormulIA.");
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
        <h1>Entrar</h1>
        <p>Solo usuarios invitados pueden acceder al tenant.</p>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void signInWithPassword();
              }
            }}
          />
        </label>
        <label>
          <span>Contrasena</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void signInWithPassword();
              }
            }}
          />
        </label>
        <div className="loginActions">
          <button
            className="primaryButton"
            type="button"
            onClick={signInWithPassword}
            disabled={status === "working"}
          >
            {status === "working" ? <Loader2 className="spin" size={17} /> : <LogIn size={17} />}
            Entrar
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={signInWithEmail}
            disabled={status === "working"}
          >
            <KeyRound size={17} />
            Enviar enlace
          </button>
        </div>
        <div className="statusLine" data-state={status === "error" ? "error" : "idle"}>
          <span>{message}</span>
        </div>
      </section>
    </main>
  );
}
