from __future__ import annotations

import uuid
from typing import Any

from fastapi import HTTPException
from sqlmodel import Session, select

from .models import RawMaterial, RawMaterialPrice


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


def normalize_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def clean_raw_material_payload(values: dict[str, Any]) -> dict[str, Any]:
    cleaned = dict(values)
    for key in (
        "code",
        "external_code",
        "name",
        "family",
        "subfamily",
        "physical_state",
        "solubility",
        "notes",
    ):
        if key in cleaned:
            cleaned[key] = clean_text(cleaned[key])
    if "name" in cleaned and cleaned["name"] is None:
        raise HTTPException(status_code=400, detail="Raw material name cannot be empty.")
    return cleaned


def ensure_raw_material_identity_available(
    session: Session,
    tenant_id: uuid.UUID,
    *,
    code: str | None,
    external_code: str | None,
    normalized_name: str | None = None,
    exclude_raw_material_id: uuid.UUID | None = None,
) -> None:
    materials = session.exec(
        select(RawMaterial).where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.is_active.is_(True),
        )
    ).all()
    code_key = _identity_key(code)
    external_code_key = _identity_key(external_code)
    normalized_name_key = _identity_key(normalized_name)
    for material in materials:
        if exclude_raw_material_id is not None and material.id == exclude_raw_material_id:
            continue
        if code_key and _identity_key(material.code) == code_key:
            raise HTTPException(
                status_code=409,
                detail="Raw material code already exists for this tenant.",
            )
        if external_code_key and _identity_key(material.external_code) == external_code_key:
            raise HTTPException(
                status_code=409,
                detail="Raw material SAP code already exists for this tenant.",
            )
        if normalized_name_key and _identity_key(material.normalized_name) == normalized_name_key:
            raise HTTPException(
                status_code=409,
                detail="Raw material name already exists for this tenant.",
            )


def ensure_valid_raw_material_price(price: float) -> None:
    if price < 0:
        raise HTTPException(status_code=400, detail="Raw material price cannot be negative.")


def list_raw_material_prices(
    session: Session,
    tenant_id: uuid.UUID,
    raw_material_id: uuid.UUID,
) -> list[RawMaterialPrice]:
    return session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id == raw_material_id,
        )
        .order_by(RawMaterialPrice.valid_from.desc(), RawMaterialPrice.created_at.desc())
    ).all()


def _identity_key(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().casefold().split())
    return cleaned or None
