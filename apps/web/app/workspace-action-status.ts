import { useCallback, useState } from "react";
import type { Status } from "./workspace-model";

export function useWorkspaceActionStatus() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready");

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
        setStatus("idle");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Action failed");
      }
    },
    [setError],
  );

  return {
    status,
    message,
    setStatus,
    setMessage,
    setError,
    runAction,
  };
}
