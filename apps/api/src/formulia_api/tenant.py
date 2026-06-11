from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException
from sqlmodel import Session, select

from .database import get_session
from .models import Tenant, TenantMember, User


DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@dataclass(frozen=True)
class TenantContext:
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    role: str


def get_current_user(
    session: Session = Depends(get_session),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> User:
    user_id = uuid.UUID(x_user_id) if x_user_id else DEV_USER_ID
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
