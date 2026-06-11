from __future__ import annotations

import uuid
import os
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from fastapi import Depends, Header, HTTPException
from sqlmodel import Session, select

from .database import get_session
from .models import Tenant, TenantInvitation, TenantMember, User, utc_now


DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@dataclass(frozen=True)
class TenantContext:
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    role: str


def get_current_user(
    session: Session = Depends(get_session),
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> User:
    token = _bearer_token(authorization)
    if token is not None:
        return _get_supabase_user(session, token)

    if x_user_id is None or not _dev_auth_allowed():
        raise HTTPException(status_code=401, detail="Authentication is required.")

    try:
        user_id = uuid.UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid X-User-Id header.") from exc
    user = session.get(User, user_id)
    if user is not None:
        return user

    user = User(
        id=user_id,
        email=f"{user_id}@local.formulia",
        name="Local Developer",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def require_tenant_context(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
) -> TenantContext:
    if x_tenant_id is None:
        raise HTTPException(status_code=400, detail="X-Tenant-Id header is required.")

    try:
        tenant_id = uuid.UUID(x_tenant_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="X-Tenant-Id must be a UUID.") from exc

    tenant = session.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found.")

    member = session.exec(
        select(TenantMember).where(
            TenantMember.tenant_id == tenant_id,
            TenantMember.user_id == user.id,
            TenantMember.status == "active",
        )
    ).first()
    if member is None:
        raise HTTPException(status_code=403, detail="User is not a member of this tenant.")

    return TenantContext(tenant_id=tenant_id, user_id=user.id, role=member.role)


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def require_tenant_admin(tenant: TenantContext) -> None:
    if tenant.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Tenant admin role is required.")


def normalize_tenant_role(role: str) -> str:
    normalized = role.strip().casefold()
    if normalized == "formulador":
        return "formulator"
    if normalized in {"owner", "admin", "formulator", "viewer"}:
        return normalized
    raise HTTPException(status_code=400, detail="Tenant role is invalid.")


def _bearer_token(authorization: str | None) -> str | None:
    if authorization is None:
        return None
    scheme, _, value = authorization.partition(" ")
    if scheme.casefold() != "bearer" or not value.strip():
        raise HTTPException(status_code=401, detail="Invalid Authorization header.")
    return value.strip()


def _dev_auth_allowed() -> bool:
    return os.getenv("FORMULIA_AUTH_REQUIRED") != "1"


def _get_supabase_user(session: Session, token: str) -> User:
    payload = _fetch_supabase_user(token)
    try:
        user_id = uuid.UUID(str(payload["id"]))
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid Supabase user payload.") from exc

    email = normalize_email(str(payload.get("email") or ""))
    if not email:
        raise HTTPException(status_code=401, detail="Authenticated user email is required.")

    metadata = payload.get("user_metadata") if isinstance(payload.get("user_metadata"), dict) else {}
    name = metadata.get("name") or metadata.get("full_name") or email

    user = session.get(User, user_id)
    if user is None:
        invitations = _pending_invitations(session, email)
        if not invitations:
            raise HTTPException(status_code=403, detail="User is not invited.")
        user = User(id=user_id, email=email, name=name)
        session.add(user)
        session.flush()
        _accept_pending_invitations(session, user, invitations)
        session.commit()
        session.refresh(user)
        return user

    user.email = email
    user.name = name
    session.add(user)
    invitations = _pending_invitations(session, email)
    if invitations:
        _accept_pending_invitations(session, user, invitations)
    session.commit()
    session.refresh(user)
    return user


def _fetch_supabase_user(token: str) -> dict[str, object]:
    supabase_url = _supabase_url()
    anon_key = _supabase_anon_key()
    try:
        response = httpx.get(
            f"{supabase_url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": anon_key},
            timeout=10,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=401, detail="Supabase auth validation failed.") from exc
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid or expired Supabase token.")
    if response.status_code >= 400:
        raise HTTPException(status_code=401, detail="Supabase auth validation failed.")
    data = response.json()
    if not isinstance(data, dict):
        raise HTTPException(status_code=401, detail="Invalid Supabase user payload.")
    return data


def _pending_invitations(session: Session, email: str) -> list[TenantInvitation]:
    now = utc_now()
    invitations = session.exec(
        select(TenantInvitation).where(
            TenantInvitation.email == email,
            TenantInvitation.status == "pending",
        )
    ).all()
    return [
        invitation
        for invitation in invitations
        if invitation.expires_at is None or _as_utc(invitation.expires_at) > now
    ]


def _accept_pending_invitations(
    session: Session,
    user: User,
    invitations: list[TenantInvitation],
) -> None:
    now = utc_now()
    for invitation in invitations:
        membership = session.exec(
            select(TenantMember).where(
                TenantMember.tenant_id == invitation.tenant_id,
                TenantMember.user_id == user.id,
            )
        ).first()
        if membership is None:
            membership = TenantMember(
                tenant_id=invitation.tenant_id,
                user_id=user.id,
                role=normalize_tenant_role(invitation.role),
                status="active",
            )
        else:
            membership.role = normalize_tenant_role(invitation.role)
            membership.status = "active"
        invitation.status = "accepted"
        invitation.accepted_by = user.id
        invitation.accepted_at = now
        session.add(membership)
        session.add(invitation)


def _supabase_url() -> str:
    value = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or os.getenv("FORMULIA_SUPABASE_URL")
        or ""
    ).strip().rstrip("/")
    if not value:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured.")
    return value


def _supabase_anon_key() -> str:
    value = (
        os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or os.getenv("FORMULIA_SUPABASE_ANON_KEY")
        or ""
    ).strip()
    if not value:
        raise HTTPException(status_code=500, detail="SUPABASE_ANON_KEY is not configured.")
    return value


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
