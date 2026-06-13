import { KeyRound, Plus, Save, Send } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { TenantInvitationRead } from "./workspace-base-model";
import type { InvitationForm, ParameterForm } from "./workspace-core-state";

type WorkspaceSettingsSectionProps = {
  active: boolean;
  hasTenant: boolean;
  workspaceName: string;
  isBusy: boolean;
  onWorkspaceNameChange: (value: string) => void;
  onCreateWorkspace: () => void | Promise<void>;
};

export function WorkspaceSettingsSection({
  active,
  hasTenant,
  workspaceName,
  isBusy,
  onWorkspaceNameChange,
  onCreateWorkspace,
}: WorkspaceSettingsSectionProps) {
  return (
    <section className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Workspace</h2>
        <span>{hasTenant ? "Active" : "New"}</span>
      </div>
      <div className="formGrid">
        <label>
          <span>Name</span>
          <input
            value={workspaceName}
            onChange={(event) => onWorkspaceNameChange(event.target.value)}
            disabled={isBusy}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateWorkspace()}
          disabled={isBusy}
        >
          <Plus size={17} />
          Create workspace
        </button>
      </div>
    </section>
  );
}

type AccountSettingsSectionProps = {
  active: boolean;
  sessionEmail: string | null | undefined;
};

export function AccountSettingsSection({
  active,
  sessionEmail,
}: AccountSettingsSectionProps) {
  return (
    <section className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Mi cuenta</h2>
        <span>{sessionEmail ?? "Sesion activa"}</span>
      </div>
      <div className="accountActions">
        <a className="secondaryButton" href="/update-password">
          <KeyRound size={17} />
          Cambiar contrasena
        </a>
      </div>
    </section>
  );
}

type TenantInvitationsSectionProps = {
  active: boolean;
  invitationForm: InvitationForm;
  tenantInvitations: TenantInvitationRead[];
  canManageTenantUsers: boolean;
  onInvitationFormChange: Dispatch<SetStateAction<InvitationForm>>;
  onCreateTenantInvitation: () => void | Promise<void>;
};

export function TenantInvitationsSection({
  active,
  invitationForm,
  tenantInvitations,
  canManageTenantUsers,
  onInvitationFormChange,
  onCreateTenantInvitation,
}: TenantInvitationsSectionProps) {
  return (
    <section className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Invitaciones</h2>
        <span>Admin only</span>
      </div>
      <div className="formGrid inviteFormGrid">
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            inputMode="email"
            value={invitationForm.email}
            onChange={(event) =>
              onInvitationFormChange((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            disabled={!canManageTenantUsers}
          />
        </label>
        <label>
          <span>Rol</span>
          <select
            value={invitationForm.role}
            onChange={(event) =>
              onInvitationFormChange((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
            disabled={!canManageTenantUsers}
          >
            <option value="formulator">Formulator</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateTenantInvitation()}
          disabled={!canManageTenantUsers || !invitationForm.email.trim()}
        >
          <Send size={17} />
          Enviar enlace
        </button>
      </div>
      <div className="invitationList">
        {tenantInvitations.length === 0 ? (
          <div className="empty">No tenant invitations yet.</div>
        ) : (
          tenantInvitations.map((invitation) => (
            <div className="invitationRow" key={invitation.id}>
              <span>
                <strong>{invitation.email}</strong>
                {invitation.role}
              </span>
              <code>{invitation.status}</code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

type ParameterSettingsSectionProps = {
  active: boolean;
  parameterCode: string | null;
  parameterForm: ParameterForm;
  canEditTenantData: boolean;
  onParameterFormChange: Dispatch<SetStateAction<ParameterForm>>;
  onCreateParameter: () => void | Promise<void>;
};

export function ParameterSettingsSection({
  active,
  parameterCode,
  parameterForm,
  canEditTenantData,
  onParameterFormChange,
  onCreateParameter,
}: ParameterSettingsSectionProps) {
  return (
    <section id="parameters" className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Parameter</h2>
        <span>{parameterCode ?? "None"}</span>
      </div>
      <div className="formGrid threeColumns">
        <label>
          <span>Code</span>
          <input
            value={parameterForm.code}
            onChange={(event) =>
              onParameterFormChange((current) => ({ ...current, code: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Name</span>
          <input
            value={parameterForm.name}
            onChange={(event) =>
              onParameterFormChange((current) => ({ ...current, name: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Unit</span>
          <input
            value={parameterForm.unit}
            onChange={(event) =>
              onParameterFormChange((current) => ({ ...current, unit: event.target.value }))
            }
            disabled={!canEditTenantData}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCreateParameter()}
          disabled={!canEditTenantData}
        >
          <Save size={17} />
          Save parameter
        </button>
      </div>
    </section>
  );
}
