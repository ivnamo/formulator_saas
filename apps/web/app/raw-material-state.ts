import { useState } from "react";
import { type MaterialForm } from "./workspace-model";

const emptyMaterialForm: MaterialForm = {
  code: "",
  name: "",
  price: "",
  parameterValue: "",
};

export function useRawMaterialWorkspaceState() {
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const [detailedMaterialIds, setDetailedMaterialIds] = useState<string[]>([]);
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});

  return {
    materialForm,
    setMaterialForm,
    detailedMaterialIds,
    setDetailedMaterialIds,
    aliasInputs,
    setAliasInputs,
  };
}
