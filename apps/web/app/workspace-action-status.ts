import { useCallback, useEffect, useState } from "react";
import type { Status } from "./workspace-base-model";

export function useWorkspaceActionStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready");

  const clearStatus = useCallback(() => {
    setStatus("idle");
    setMessage("Ready");
  }, []);

  const setError = useCallback((nextMessage: string) => {
    setStatus("error");
    setMessage(nextMessage);
  }, []);

  const runAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setStatus("working");
      setMessage(label);
      try {
        await action();
        setStatus("success");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Action failed");
      }
    },
    [setError],
  );

  useEffect(() => {
    if (status !== "success") {
      return;
    }
    const timeout = window.setTimeout(clearStatus, 6000);
    return () => window.clearTimeout(timeout);
  }, [clearStatus, status, message]);

  return {
    status,
    message,
    setStatus,
    setMessage,
    setError,
    clearStatus,
    runAction,
  };
}
