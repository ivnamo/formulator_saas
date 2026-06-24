import { BarChart3, KeyRound, Plus, RefreshCw, Save, Send, UserCog } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ProductEventSummary } from "./product-observability-api";
import type { TenantInvitationRead, TenantMemberRead } from "./workspace-base-model";
import type { InvitationForm, ParameterForm } from "./workspace-core-state";
import { formatDateTime } from "./workspace-utils";

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
  tenantMembers: TenantMemberRead[];
  tenantInvitations: TenantInvitationRead[];
  canManageTenantUsers: boolean;
  onInvitationFormChange: Dispatch<SetStateAction<InvitationForm>>;
  onCreateTenantInvitation: () => void | Promise<void>;
  onUpdateTenantMemberRole: (
    member: TenantMemberRead,
    role: string,
  ) => void | Promise<void>;
};

export function TenantInvitationsSection({
  active,
  invitationForm,
  tenantMembers,
  tenantInvitations,
  canManageTenantUsers,
  onInvitationFormChange,
  onCreateTenantInvitation,
  onUpdateTenantMemberRole,
}: TenantInvitationsSectionProps) {
  return (
    <section className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Usuarios y roles</h2>
        <span>{canManageTenantUsers ? "Admin" : "Solo lectura"}</span>
      </div>
      <div className="tenantMemberList">
        <div className="tenantMemberListHead">
          <span>
            <UserCog size={15} />
            Miembro
          </span>
          <span>Rol</span>
          <span>Estado</span>
        </div>
        {tenantMembers.length === 0 ? (
          <div className="empty">No hay miembros activos cargados.</div>
        ) : (
          tenantMembers.map((member) => (
            <div className="tenantMemberRow" key={member.id}>
              <span>
                <strong>{member.name || member.email}</strong>
                <small>{member.email}</small>
              </span>
              <select
                aria-label={`Rol de ${member.email}`}
                value={member.role}
                onChange={(event) => void onUpdateTenantMemberRole(member, event.target.value)}
                disabled={!canManageTenantUsers}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="formulator">Formulator</option>
                <option value="viewer">Viewer</option>
              </select>
              <code>{member.status}</code>
            </div>
          ))
        )}
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

type ProductObservabilitySectionProps = {
  active: boolean;
  summary: ProductEventSummary | null;
  isBusy: boolean;
  onRefresh: () => void | Promise<void>;
};

export function ProductObservabilitySection({
  active,
  summary,
  isBusy,
  onRefresh,
}: ProductObservabilitySectionProps) {
  return (
    <section className="panel setupPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Observabilidad</h2>
        <span>{summary ? `${summary.total} eventos` : "Sin datos"}</span>
      </div>
      <div className="observabilityHeader">
        <div>
          <BarChart3 size={18} />
          <strong>Uso de producto</strong>
        </div>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onRefresh()}
          disabled={isBusy}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>
      {summary ? (
        <>
          <div className="observabilityGrid">
            <EventCountList title="Pantallas" rows={summary.by_surface} />
            <EventCountList title="Eventos" rows={summary.by_event_type} />
          </div>
          <div className="observabilityRecent">
            <div className="observabilityRecentHead">
              <span>Fecha</span>
              <span>Pantalla</span>
              <span>Evento</span>
              <span>Elemento</span>
            </div>
            {summary.recent.length === 0 ? (
              <div className="empty">No hay eventos registrados.</div>
            ) : (
              summary.recent.map((event) => (
                <div className="observabilityRecentRow" key={event.id}>
                  <span>{formatDateTime(event.created_at)}</span>
                  <strong>{event.surface}</strong>
                  <code>{event.event_type}</code>
                  <span>{event.element ?? "-"}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="empty">No hay resumen cargado.</div>
      )}
    </section>
  );
}

function EventCountList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  return (
    <div className="observabilityCountList">
      <strong>{title}</strong>
      {rows.length === 0 ? (
        <span className="empty">Sin eventos</span>
      ) : (
        rows.slice(0, 8).map((row) => (
          <div key={row.key}>
            <span>{row.key}</span>
            <code>{row.count}</code>
          </div>
        ))
      )}
    </div>
  );
}
