import { Plus } from "lucide-react";
import type { JiraFieldMetadata, JiraMetadataState } from "./jira-connection-model";

const JIRA_MAPPING_KEYS = [
  "formula_id",
  "formula_short_id",
  "formula_name",
  "formula_version",
  "formula_status",
  "jira_project_id",
  "jira_issue_type",
  "jira_product_type",
  "jira_product_type_option",
  "estimated_cost",
  "notes",
] as const;

type JiraMetadataPanelProps = {
  jiraMetadata: JiraMetadataState;
  jiraMappingKey: string;
  canEditTenantData: boolean;
  onJiraMappingKeyChange: (value: string) => void;
  onMapJiraField: (field: JiraFieldMetadata) => void;
};

export function JiraMetadataPanel({
  jiraMetadata,
  jiraMappingKey,
  canEditTenantData,
  onJiraMappingKeyChange,
  onMapJiraField,
}: JiraMetadataPanelProps) {
  return (
    <div className="jiraMetadataPanel">
      <div className="jiraMetadataHeader">
        <div>
          <span>Metadata</span>
          <strong>
            {jiraMetadata.projectKey} / {jiraMetadata.issueType}
          </strong>
        </div>
        <label>
          <span>FormulIA field</span>
          <select
            value={jiraMappingKey}
            onChange={(event) => onJiraMappingKeyChange(event.target.value)}
            disabled={!canEditTenantData}
          >
            {JIRA_MAPPING_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="jiraMetadataColumns">
        <div>
          <span>Projects</span>
          <div className="jiraMetadataList">
            {jiraMetadata.projects.map((project) => (
              <div className="jiraMetadataRow" key={project.key}>
                <code>{project.key}</code>
                <strong>{project.name}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <span>Issue types</span>
          <div className="jiraMetadataList">
            {jiraMetadata.issueTypes.map((issueType) => (
              <div className="jiraMetadataRow" key={issueType.id}>
                <code>{issueType.id}</code>
                <strong>{issueType.name}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="jiraMetadataFields">
          <span>Fields</span>
          <div className="jiraMetadataList">
            {jiraMetadata.fields.map((field) => (
              <div className="jiraMetadataRow" key={field.field_id}>
                <code>{field.field_id}</code>
                <strong>{field.name}</strong>
                <small>
                  {field.required ? "Required" : "Optional"}
                  {field.schema_type ? ` - ${field.schema_type}` : ""}
                  {field.allowed_values.length > 0
                    ? ` - ${field.allowed_values
                        .map((value) => value.value ?? value.name ?? value.key ?? value.id)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(", ")}`
                    : ""}
                </small>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onMapJiraField(field)}
                  disabled={!canEditTenantData}
                  title={`Map ${jiraMappingKey}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
