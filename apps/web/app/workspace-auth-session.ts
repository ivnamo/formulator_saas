import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase-client";
import type { WorkspaceState } from "./workspace-state-model";

const SESSION_CHECK_TIMEOUT_MS = 8000;

type AuthenticatedWorkspaceLoadOptions = {
  session: Session | null;
  tenant: WorkspaceState["tenant"];
  loadAuthenticatedWorkspace: (accessToken: string) => void | Promise<void>;
};

export function useWorkspaceAuthSession(tenant: WorkspaceState["tenant"]) {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    let redirected = false;

    const redirectToLogin = () => {
      if (!mounted || redirected) {
        return;
      }
      redirected = true;
      setAuthChecked(true);
      window.location.assign("/login");
    };

    const timeoutId = window.setTimeout(() => {
      redirectToLogin();
    }, SESSION_CHECK_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted || redirected) {
          return;
        }
        window.clearTimeout(timeoutId);
        if (!data.session) {
          redirectToLogin();
          return;
        }
        setSession(data.session);
        setAuthChecked(true);
      })
      .catch(() => {
        if (!mounted || redirected) {
          return;
        }
        window.clearTimeout(timeoutId);
        redirectToLogin();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted || redirected) {
        return;
      }
      window.clearTimeout(timeoutId);
      if (!nextSession) {
        redirectToLogin();
        return;
      }
      setSession(nextSession);
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    }),
    [session?.access_token],
  );

  const headers = useMemo(
    () => ({
      ...authHeaders,
      ...(tenant ? { "X-Tenant-Id": tenant.id } : {}),
    }),
    [authHeaders, tenant],
  );

  const uploadHeaders = useMemo(
    () => ({
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...(tenant ? { "X-Tenant-Id": tenant.id } : {}),
    }),
    [session?.access_token, tenant],
  );

  return {
    session,
    authChecked,
    authHeaders,
    headers,
    uploadHeaders,
  };
}

export function useAuthenticatedWorkspaceLoad({
  session,
  tenant,
  loadAuthenticatedWorkspace,
}: AuthenticatedWorkspaceLoadOptions) {
  useEffect(() => {
    if (!session?.access_token || tenant) {
      return;
    }
    void loadAuthenticatedWorkspace(session.access_token);
  }, [loadAuthenticatedWorkspace, session?.access_token, tenant]);
}
