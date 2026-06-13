import { useCallback, useState } from "react";
import {
  initialIsoDesignProjectForm,
  type IsoDesignProject,
  type IsoDesignProjectForm,
  type IsoDesignTrial,
  type IsoLegacyImportFormat,
  type IsoLegacyImportPreview,
  type IsoProductValidation,
  type IsoTenantSettings,
} from "./iso-design-model";

export function useIsoDesignState() {
  const [isoSettings, setIsoSettings] = useState<IsoTenantSettings | null>(null);
  const [isoDesignProjects, setIsoDesignProjects] = useState<IsoDesignProject[]>([]);
  const [isoDesignTrialsByProjectId, setIsoDesignTrialsByProjectId] = useState<
    Record<string, IsoDesignTrial[]>
  >({});
  const [isoProductValidationsByProjectId, setIsoProductValidationsByProjectId] = useState<
    Record<string, IsoProductValidation | null>
  >({});
  const [selectedIsoDesignProjectId, setSelectedIsoDesignProjectId] = useState("");
  const [isoProjectForm, setIsoProjectForm] = useState<IsoDesignProjectForm>(
    initialIsoDesignProjectForm,
  );
  const [isoLegacyImportFormat, setIsoLegacyImportFormat] =
    useState<IsoLegacyImportFormat>("f10_01");
  const [isoLegacyImportFile, setIsoLegacyImportFile] = useState<File | null>(null);
  const [selectedIsoLegacyImportSheet, setSelectedIsoLegacyImportSheet] = useState("");
  const [isoLegacyImportPreview, setIsoLegacyImportPreview] =
    useState<IsoLegacyImportPreview | null>(null);

  const resetIsoDesignState = useCallback(() => {
    setIsoSettings(null);
    setIsoDesignProjects([]);
    setIsoDesignTrialsByProjectId({});
    setIsoProductValidationsByProjectId({});
    setSelectedIsoDesignProjectId("");
    setIsoProjectForm(initialIsoDesignProjectForm);
    setIsoLegacyImportFormat("f10_01");
    setIsoLegacyImportFile(null);
    setSelectedIsoLegacyImportSheet("");
    setIsoLegacyImportPreview(null);
  }, []);

  return {
    isoSettings,
    setIsoSettings,
    isoDesignProjects,
    setIsoDesignProjects,
    isoDesignTrialsByProjectId,
    setIsoDesignTrialsByProjectId,
    isoProductValidationsByProjectId,
    setIsoProductValidationsByProjectId,
    selectedIsoDesignProjectId,
    setSelectedIsoDesignProjectId,
    isoProjectForm,
    setIsoProjectForm,
    isoLegacyImportFormat,
    setIsoLegacyImportFormat,
    isoLegacyImportFile,
    setIsoLegacyImportFile,
    selectedIsoLegacyImportSheet,
    setSelectedIsoLegacyImportSheet,
    isoLegacyImportPreview,
    setIsoLegacyImportPreview,
    resetIsoDesignState,
  };
}
