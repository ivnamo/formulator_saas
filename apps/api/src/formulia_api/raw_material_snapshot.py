from __future__ import annotations

import uuid
from collections import defaultdict
from typing import Any

from sqlmodel import Session, select

from .models import Parameter, RawMaterialParameterValue, RawMaterialPrice
from .parameter_order import sort_parameters


def current_prices_by_material_id(
    session: Session,
    tenant_id: uuid.UUID,
    material_ids: list[uuid.UUID],
) -> dict[uuid.UUID, RawMaterialPrice]:
    if not material_ids:
        return {}
    prices = session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id.in_(material_ids),
        )
        .order_by(
            RawMaterialPrice.raw_material_id,
            RawMaterialPrice.valid_from.desc(),
            RawMaterialPrice.created_at.desc(),
        )
    ).all()
    current: dict[uuid.UUID, RawMaterialPrice] = {}
    for price in prices:
        current.setdefault(price.raw_material_id, price)
    return current


def active_parameter_values_by_material_id(
    session: Session,
    tenant_id: uuid.UUID,
    material_ids: list[uuid.UUID],
) -> dict[uuid.UUID, list[tuple[RawMaterialParameterValue, Parameter]]]:
    if not material_ids:
        return {}
    rows = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id.in_(material_ids),
            Parameter.tenant_id == tenant_id,
            Parameter.is_active.is_(True),
        )
        .order_by(RawMaterialParameterValue.raw_material_id, Parameter.code)
    ).all()
    by_material_id: dict[uuid.UUID, list[tuple[RawMaterialParameterValue, Parameter]]] = (
        defaultdict(list)
    )
    for value, parameter in rows:
        by_material_id[value.raw_material_id].append((value, parameter))
    for material_id, material_rows in by_material_id.items():
        by_material_id[material_id] = sort_parameters(
            material_rows,
            key=lambda row: row[1].code,
        )
    return by_material_id


def active_parameter_value_dicts_by_material_id(
    session: Session,
    tenant_id: uuid.UUID,
    material_ids: list[uuid.UUID],
) -> dict[uuid.UUID, list[dict[str, Any]]]:
    return {
        material_id: [
            {
                "code": parameter.code,
                "name": parameter.name,
                "value": value.value,
                "unit": parameter.unit,
                "source": value.source,
            }
            for value, parameter in rows
        ]
        for material_id, rows in active_parameter_values_by_material_id(
            session,
            tenant_id,
            material_ids,
        ).items()
    }


def active_parameter_value_map_by_material_id(
    session: Session,
    tenant_id: uuid.UUID,
    material_ids: list[uuid.UUID],
) -> dict[uuid.UUID, dict[str, float]]:
    return {
        material_id: {
            parameter.code: value.value
            for value, parameter in rows
        }
        for material_id, rows in active_parameter_values_by_material_id(
            session,
            tenant_id,
            material_ids,
        ).items()
    }
