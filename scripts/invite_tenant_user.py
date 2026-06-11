from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select


WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WORKSPACE_ROOT / "apps" / "api" / "src"))

from formulia_api.database import create_db_engine, init_db
from formulia_api.local_env import load_local_env
from formulia_api.models import Tenant, TenantInvitation
from formulia_api.tenant import normalize_email, normalize_tenant_role


def main() -> None:
    args = parse_args()
    load_local_env(WORKSPACE_ROOT)
    engine = create_db_engine()
    init_db(engine)

    with Session(engine) as session:
        tenant = session.exec(select(Tenant).where(Tenant.slug == args.tenant_slug)).first()
        if tenant is None:
            raise SystemExit(f"Tenant not found: {args.tenant_slug}")

        email = normalize_email(args.email)
        role = normalize_tenant_role(args.role)
        invitation = session.exec(
            select(TenantInvitation).where(
                TenantInvitation.tenant_id == tenant.id,
                TenantInvitation.email == email,
            )
        ).first()
        created = invitation is None
        if invitation is None:
            invitation = TenantInvitation(
                tenant_id=tenant.id,
                email=email,
                role=role,
                status="pending",
                expires_at=args.expires_at,
            )
        else:
            invitation.role = role
            invitation.status = "pending"
            invitation.expires_at = args.expires_at
            invitation.accepted_by = None
            invitation.accepted_at = None
        session.add(invitation)
        session.commit()
        session.refresh(invitation)
        print(
            {
                "tenant_id": str(tenant.id),
                "invitation_id": str(invitation.id),
                "email": invitation.email,
                "role": invitation.role,
                "created": created,
            }
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Invite a user to a FormulIA tenant.")
    parser.add_argument("email")
    parser.add_argument("--tenant-slug", default="atlantica-agricola")
    parser.add_argument(
        "--role",
        choices=["owner", "admin", "formulator", "formulador", "viewer"],
        default="formulator",
    )
    parser.add_argument("--expires-at", type=datetime.fromisoformat)
    return parser.parse_args()


if __name__ == "__main__":
    main()
