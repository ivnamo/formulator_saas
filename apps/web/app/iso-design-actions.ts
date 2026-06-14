import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  applyIsoLegacyImport,
  createIsoDesignProjectApi,
  createIsoDesignTrialFromJiraReview,
  createIsoDossierExport,
  createIsoF1001Export,
  createIsoF1002Export,
  createIsoF1003Export,
  createIsoProductValidationApi,
  downloadIsoArtifactBlob,
  getIsoProductValidation,
  getIsoTenantSettings,
  listIsoDesignProjects,
  listIsoDesignTrials,
  previewIsoLegacyImport,
  publishIsoProductValidationApi,
  updateIsoProductValidationChecksApi,
  updateIsoTenantSettings,
} from "./iso-design-api";
import {
  initialIsoDesignProjectForm,
  type IsoDesignProject,
  type IsoDesignProjectForm,
  type IsoDesignTrial,
  type IsoLegacyImportFormat,
  type IsoLegacyImportPreview,
  type IsoProductValidation,
  type IsoRecordArtifact,
  type IsoValidationCheck,
  type IsoTenantSettings,
} from "./iso-design-model";
import { isTenantAdminRole } from "./tenant-roles";
import type { WorkspaceState } from "./workspace-state-model";

type IsoDesignActionsOptions = {
  workspace: WorkspaceState;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
  isoProjectForm: IsoDesignProjectForm;
  isoLegacyImportFormat: IsoLegacyImportFormat;
  isoLegacyImportFile: File | null;
  selectedIsoLegacyImportSheet: string;
  selectedIsoDesignProjectId: string;
  isoDesignTrialsByProjectId: Record<string, IsoDesignTrial[]>;
  isoProductValidationsByProjectId: Record<string, IsoProductValidation | null>;
  setIsoSettings: Dispatch<SetStateAction<IsoTenantSettings | null>>;
  setIsoDesignProjects: Dispatch<SetStateAction<IsoDesignProject[]>>;
  setIsoDesignTrialsByProjectId: Dispatch<SetStateAction<Record<string, IsoDesignTrial[]>>>;
  setIsoProductValidationsByProjectId: Dispatch<
    SetStateAction<Record<string, IsoProductValidation | null>>
  >;
  setSelectedIsoDesignProjectId: Dispatch<SetStateAction<string>>;
  setIsoProjectForm: Dispatch<SetStateAction<IsoDesignProjectForm>>;
  setIsoLegacyImportFormat: Dispatch<SetStateAction<IsoLegacyImportFormat>>;
  setIsoLegacyImportFile: Dispatch<SetStateAction<File | null>>;
  setSelectedIsoLegacyImportSheet: Dispatch<SetStateAction<string>>;
  setIsoLegacyImportPreview: Dispatch<SetStateAction<IsoLegacyImportPreview | null>>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
  onProjectCreated?: (project: IsoDesignProject) => boolean | void;
};

export function useIsoDesignActions({
  workspace,
  headers,
  uploadHeaders,
  isoProjectForm,
  isoLegacyImportFormat,
  isoLegacyImportFile,
  selectedIsoLegacyImportSheet,
  selectedIsoDesignProjectId,
  isoDesignTrialsByProjectId,
  isoProductValidationsByProjectId,
  setIsoSettings,
  setIsoDesignProjects,
  setIsoDesignTrialsByProjectId,
  setIsoProductValidationsByProjectId,
  setSelectedIsoDesignProjectId,
  setIsoProjectForm,
  setIsoLegacyImportFormat,
  setIsoLegacyImportFile,
  setSelectedIsoLegacyImportSheet,
  setIsoLegacyImportPreview,
  runAction,
  setError,
  setMessage,
  onProjectCreated,
}: IsoDesignActionsOptions) {
  const downloadIsoArtifact = useCallback(
    async (artifact: IsoRecordArtifact) => {
      const blobUrl = URL.createObjectURL(await downloadIsoArtifactBlob(headers, artifact.id));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = artifact.file_name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    },
    [headers],
  );

  const loadIsoProjectDetails = useCallback(
    async (projectId: string) => {
      if (!projectId) {
        return;
      }
      const [trials, validation] = await Promise.all([
        listIsoDesignTrials(headers, projectId),
        getIsoProductValidation(headers, projectId),
      ]);
      setIsoDesignTrialsByProjectId((current) => ({ ...current, [projectId]: trials }));
      setIsoProductValidationsByProjectId((current) => ({ ...current, [projectId]: validation }));
    },
    [headers, setIsoDesignTrialsByProjectId, setIsoProductValidationsByProjectId],
  );

  const selectIsoDesignProject = useCallback(
    (projectId: string) => {
      setSelectedIsoDesignProjectId(projectId);
      if (!workspace.tenant || !projectId) {
        return;
      }
      if (
        isoDesignTrialsByProjectId[projectId] !== undefined &&
        Object.prototype.hasOwnProperty.call(isoProductValidationsByProjectId, projectId)
      ) {
        return;
      }
      void loadIsoProjectDetails(projectId).catch((error: unknown) => {
        setError(error instanceof Error ? error.message : "Could not load ISO project detail");
      });
    },
    [
      isoDesignTrialsByProjectId,
      isoProductValidationsByProjectId,
      loadIsoProjectDetails,
      setError,
      setSelectedIsoDesignProjectId,
      workspace.tenant,
    ],
  );

  const loadIsoModule = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      const load = async () => {
        const settings = await getIsoTenantSettings(headers);
        setIsoSettings(settings);
        if (settings.enabled) {
          const projects = await listIsoDesignProjects(headers);
          setIsoDesignProjects(projects);
          const projectIds = new Set(projects.map((project) => project.id));
          const firstProjectId = projects[0]?.id ?? "";
          setIsoDesignTrialsByProjectId((current) =>
            Object.fromEntries(
              Object.entries(current).filter(([projectId]) => projectIds.has(projectId)),
            ),
          );
          setIsoProductValidationsByProjectId((current) =>
            Object.fromEntries(
              Object.entries(current).filter(([projectId]) => projectIds.has(projectId)),
            ),
          );
          setSelectedIsoDesignProjectId((current) =>
            current && projectIds.has(current) ? current : firstProjectId,
          );
          if (firstProjectId) {
            await loadIsoProjectDetails(firstProjectId);
          }
        } else {
          setIsoDesignProjects([]);
          setIsoDesignTrialsByProjectId({});
          setIsoProductValidationsByProjectId({});
          setSelectedIsoDesignProjectId("");
        }
      };

      if (options.silent) {
        try {
          await load();
        } catch (error) {
          setError(error instanceof Error ? error.message : "Could not load ISO 9001 module");
        }
        return;
      }

      await runAction("Loading ISO 9001 module", async () => {
        await load();
        setMessage("ISO 9001 module loaded");
      });
    },
    [
      headers,
      loadIsoProjectDetails,
      runAction,
      setError,
      setIsoDesignProjects,
      setIsoSettings,
      setIsoProductValidationsByProjectId,
      setMessage,
      setSelectedIsoDesignProjectId,
      setIsoDesignTrialsByProjectId,
      workspace.tenant,
    ],
  );

  const enableIsoModule = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!isTenantAdminRole(workspace.tenant.role)) {
      setError("Only tenant admins can activate ISO 9001");
      return;
    }

    await runAction("Activating ISO 9001 module", async () => {
      const settings = await updateIsoTenantSettings(headers, { enabled: true });
      setIsoSettings(settings);
      const projects = await listIsoDesignProjects(headers);
      setIsoDesignProjects(projects);
      setIsoDesignTrialsByProjectId({});
      setIsoProductValidationsByProjectId({});
      const nextSelectedProjectId = projects[0]?.id ?? "";
      setSelectedIsoDesignProjectId(nextSelectedProjectId);
      if (nextSelectedProjectId) {
        await loadIsoProjectDetails(nextSelectedProjectId);
      }
      setMessage("ISO 9001 module active");
    });
  }, [
    headers,
    loadIsoProjectDetails,
    runAction,
    setError,
    setIsoDesignProjects,
    setIsoSettings,
    setIsoProductValidationsByProjectId,
    setIsoDesignTrialsByProjectId,
    setSelectedIsoDesignProjectId,
    setMessage,
    workspace.tenant,
  ]);

  const createIsoDesignProject = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!isoProjectForm.isoRequestNumber.trim()) {
      setError("No Solicitud is required");
      return;
    }
    if (!isoProjectForm.productName.trim()) {
      setError("Product name is required");
      return;
    }
    if (
      ["rejected", "denied", "denegado"].includes(isoProjectForm.acceptedStatus) &&
      !isoProjectForm.rejectionReason.trim()
    ) {
      setError("Rejection reason is required when the project is rejected");
      return;
    }

    await runAction("Creating ISO design project", async () => {
      const project = await createIsoDesignProjectApi(headers, isoProjectForm);
      setIsoDesignProjects((current) => [project, ...current]);
      setIsoDesignTrialsByProjectId((current) => ({ ...current, [project.id]: [] }));
      setIsoProductValidationsByProjectId((current) => ({ ...current, [project.id]: null }));
      setSelectedIsoDesignProjectId(project.id);
      setIsoProjectForm(initialIsoDesignProjectForm);
      const handled = onProjectCreated?.(project) === true;
      if (!handled) {
        setMessage(
          `F10-01 ${project.iso_request_number} listo con ProyectoID ${project.project_code ?? "-"}`,
        );
      }
    });
  }, [
    headers,
    isoProjectForm,
    onProjectCreated,
    runAction,
    setError,
    setIsoDesignProjects,
    setIsoDesignTrialsByProjectId,
    setIsoProductValidationsByProjectId,
    setIsoProjectForm,
    setSelectedIsoDesignProjectId,
    setMessage,
    workspace.tenant,
  ]);

  const linkIsoTrialFromJiraReview = useCallback(
    async (reviewId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!selectedIsoDesignProjectId) {
        setError("Select an ISO design project first");
        return;
      }

      await runAction("Linking Jira review to ISO", async () => {
        const trial = await createIsoDesignTrialFromJiraReview(
          headers,
          selectedIsoDesignProjectId,
          reviewId,
        );
        setIsoDesignTrialsByProjectId((current) => ({
          ...current,
          [selectedIsoDesignProjectId]: [
            trial,
            ...(current[selectedIsoDesignProjectId] ?? []).filter(
              (item) => item.id !== trial.id,
            ),
          ],
        }));
        await loadIsoModule({ silent: true });
        setMessage("Jira review linked to ISO");
      });
    },
    [
      headers,
      loadIsoModule,
      runAction,
      selectedIsoDesignProjectId,
      setError,
      setIsoDesignTrialsByProjectId,
      setMessage,
      workspace.tenant,
    ],
  );

  const createIsoProductValidation = useCallback(
    async (projectId: string, trialId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!projectId || !trialId) {
        setError("Select a released ISO trial first");
        return;
      }

      await runAction("Creating ISO F10-03 validation", async () => {
        const validation = await createIsoProductValidationApi(headers, projectId, {
          released_trial_id: trialId,
        });
        setIsoProductValidationsByProjectId((current) => ({
          ...current,
          [projectId]: validation,
        }));
        setMessage("F10-03 validation draft ready");
      });
    },
    [
      headers,
      runAction,
      setError,
      setIsoProductValidationsByProjectId,
      setMessage,
      workspace.tenant,
    ],
  );

  const selectIsoLegacyImportFormat = useCallback(
    (format: IsoLegacyImportFormat) => {
      setIsoLegacyImportFormat(format);
      setSelectedIsoLegacyImportSheet("");
      setIsoLegacyImportPreview(null);
    },
    [setIsoLegacyImportFormat, setIsoLegacyImportPreview, setSelectedIsoLegacyImportSheet],
  );

  const selectIsoLegacyImportFile = useCallback(
    async (file: File | null) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      setIsoLegacyImportFile(file);
      setSelectedIsoLegacyImportSheet("");
      setIsoLegacyImportPreview(null);
      if (!file) {
        return;
      }

      await runAction("Reading ISO legacy import", async () => {
        const preview = await previewIsoLegacyImport(uploadHeaders, isoLegacyImportFormat, file);
        setIsoLegacyImportPreview(preview);
        setMessage(
          `ISO import preview ready: ${preview.ready_rows} ready, ${preview.ambiguous_rows} ambiguous`,
        );
      });
    },
    [
      isoLegacyImportFormat,
      runAction,
      setError,
      setIsoLegacyImportFile,
      setIsoLegacyImportPreview,
      setMessage,
      setSelectedIsoLegacyImportSheet,
      uploadHeaders,
      workspace.tenant,
    ],
  );

  const previewSelectedIsoLegacyImportSheet = useCallback(
    async (sheetName: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!isoLegacyImportFile) {
        setError("Upload an ISO Excel file first");
        return;
      }

      await runAction("Previewing ISO legacy import", async () => {
        const preview = await previewIsoLegacyImport(
          uploadHeaders,
          isoLegacyImportFormat,
          isoLegacyImportFile,
          sheetName || null,
        );
        setSelectedIsoLegacyImportSheet(sheetName);
        setIsoLegacyImportPreview(preview);
        setMessage(
          `ISO import preview ready: ${preview.ready_rows} ready, ${preview.ambiguous_rows} ambiguous`,
        );
      });
    },
    [
      isoLegacyImportFile,
      isoLegacyImportFormat,
      runAction,
      setError,
      setIsoLegacyImportPreview,
      setMessage,
      setSelectedIsoLegacyImportSheet,
      uploadHeaders,
      workspace.tenant,
    ],
  );

  const applySelectedIsoLegacyImport = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!isoLegacyImportFile) {
      setError("Upload an ISO Excel file first");
      return;
    }

    await runAction("Applying ISO legacy import", async () => {
      const result = await applyIsoLegacyImport(
        uploadHeaders,
        isoLegacyImportFormat,
        isoLegacyImportFile,
        selectedIsoLegacyImportSheet || null,
      );
      setIsoLegacyImportPreview(result);
      await loadIsoModule({ silent: true });
      setMessage(
        `ISO import applied: ${result.created_projects + result.updated_projects} projects, ${result.created_trials + result.updated_trials} trials, ${result.created_validations + result.updated_validations} validations`,
      );
    });
  }, [
    isoLegacyImportFile,
    isoLegacyImportFormat,
    loadIsoModule,
    runAction,
    selectedIsoLegacyImportSheet,
    setError,
    setIsoLegacyImportPreview,
    setMessage,
    uploadHeaders,
    workspace.tenant,
  ]);

  const updateIsoProductValidationChecks = useCallback(
    async (validationId: string, checks: IsoValidationCheck[]) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!validationId) {
        setError("Select an ISO F10-03 validation first");
        return;
      }

      await runAction("Updating ISO F10-03 checks", async () => {
        const validation = await updateIsoProductValidationChecksApi(
          headers,
          validationId,
          checks,
        );
        setIsoProductValidationsByProjectId((current) => ({
          ...current,
          [validation.design_project_id]: validation,
        }));
        setMessage("F10-03 checks updated");
      });
    },
    [
      headers,
      runAction,
      setError,
      setIsoProductValidationsByProjectId,
      setMessage,
      workspace.tenant,
    ],
  );

  const publishIsoProductValidation = useCallback(
    async (validationId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!validationId) {
        setError("Select an ISO F10-03 validation first");
        return;
      }

      await runAction("Publishing ISO F10-03 validation", async () => {
        const validation = await publishIsoProductValidationApi(headers, validationId);
        setIsoProductValidationsByProjectId((current) => ({
          ...current,
          [validation.design_project_id]: validation,
        }));
        await loadIsoModule({ silent: true });
        setMessage("F10-03 published and ISO project validated");
      });
    },
    [
      headers,
      loadIsoModule,
      runAction,
      setError,
      setIsoProductValidationsByProjectId,
      setMessage,
      workspace.tenant,
    ],
  );

  const exportIsoF1001 = useCallback(
    async (year?: number | null) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }

      await runAction("Exporting ISO F10-01", async () => {
        const artifact = await createIsoF1001Export(headers, year);
        await downloadIsoArtifact(artifact);
        setMessage("F10-01 export downloaded");
      });
    },
    [downloadIsoArtifact, headers, runAction, setError, setMessage, workspace.tenant],
  );

  const exportIsoF1002 = useCallback(
    async (projectId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!projectId) {
        setError("Select an ISO design project first");
        return;
      }

      await runAction("Exporting ISO F10-02", async () => {
        const artifact = await createIsoF1002Export(headers, projectId);
        await downloadIsoArtifact(artifact);
        setMessage("F10-02 export downloaded");
      });
    },
    [downloadIsoArtifact, headers, runAction, setError, setMessage, workspace.tenant],
  );

  const exportIsoF1003 = useCallback(
    async (projectId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!projectId) {
        setError("Select an ISO design project first");
        return;
      }

      await runAction("Exporting ISO F10-03", async () => {
        const artifact = await createIsoF1003Export(headers, projectId);
        await downloadIsoArtifact(artifact);
        setMessage("F10-03 export downloaded");
      });
    },
    [downloadIsoArtifact, headers, runAction, setError, setMessage, workspace.tenant],
  );

  const exportIsoDossier = useCallback(
    async (projectId: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!projectId) {
        setError("Select an ISO design project first");
        return;
      }

      await runAction("Exporting ISO dossier", async () => {
        const artifact = await createIsoDossierExport(headers, projectId);
        await downloadIsoArtifact(artifact);
        setMessage("ISO dossier downloaded");
      });
    },
    [downloadIsoArtifact, headers, runAction, setError, setMessage, workspace.tenant],
  );

  return {
    loadIsoModule,
    selectIsoDesignProject,
    enableIsoModule,
    createIsoDesignProject,
    linkIsoTrialFromJiraReview,
    selectIsoLegacyImportFormat,
    selectIsoLegacyImportFile,
    previewSelectedIsoLegacyImportSheet,
    applySelectedIsoLegacyImport,
    createIsoProductValidation,
    updateIsoProductValidationChecks,
    publishIsoProductValidation,
    exportIsoF1001,
    exportIsoF1002,
    exportIsoF1003,
    exportIsoDossier,
  };
}
