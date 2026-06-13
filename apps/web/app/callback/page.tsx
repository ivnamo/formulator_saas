"use client";

import { Check, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { completeJiraOAuthCallback } from "../jira-connection-api";
import type { JiraOAuthCallbackResult } from "../jira-connection-model";

type CallbackState =
  | { status: "working"; message: string }
  | { status: "connected"; result: JiraOAuthCallbackResult }
  | { status: "error"; message: string };

export default function JiraOAuthCallbackPage() {
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: "working",
    message: "Connecting Jira OAuth",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const oauthErrorDescription = params.get("error_description");
    if (oauthError) {
      setCallbackState({
        status: "error",
        message: oauthErrorDescription ?? oauthError,
      });
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setCallbackState({
        status: "error",
        message: "Missing Jira authorization code or state.",
      });
      return;
    }

    completeJiraOAuthCallback(code, state)
      .then((result) => {
        setCallbackState({ status: "connected", result });
      })
      .catch((error: unknown) => {
        setCallbackState({
          status: "error",
          message: error instanceof Error ? error.message : "Jira OAuth callback failed.",
        });
      });
  }, []);

  return (
    <main className="callbackShell">
      <section className="callbackCard">
        <div className="callbackMark" aria-hidden="true">
          {callbackState.status === "working" ? (
            <Loader2 size={24} className="spin" />
          ) : callbackState.status === "connected" ? (
            <Check size={24} />
          ) : (
            <XCircle size={24} />
          )}
        </div>
        <div>
          <p className="eyebrow">Jira OAuth</p>
          <h1>
            {callbackState.status === "connected"
              ? "Connection ready"
              : callbackState.status === "error"
                ? "Connection failed"
                : "Finishing connection"}
          </h1>
        </div>
        {callbackState.status === "connected" ? (
          <div className="callbackDetails">
            <span>Site</span>
            <strong>{callbackState.result.site_url}</strong>
            <span>Cloud ID</span>
            <strong>{callbackState.result.cloud_id}</strong>
          </div>
        ) : (
          <p className="callbackMessage">{callbackState.message}</p>
        )}
        <a className="primaryLink" href="/#integrations">
          <ExternalLink size={17} />
          Back to FormulIA
        </a>
      </section>
    </main>
  );
}
