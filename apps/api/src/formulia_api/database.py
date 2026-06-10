from __future__ import annotations

import os
from collections.abc import Generator

from fastapi import Request
from sqlalchemy import Engine, inspect, text
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def create_db_engine(database_url: str | None = None) -> Engine:
    url = database_url or os.getenv("DATABASE_URL", "sqlite:///./formulia.db")
    connect_args = {}
    engine_args = {}

    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if url in {"sqlite://", "sqlite:///:memory:"}:
            engine_args["poolclass"] = StaticPool

    return create_engine(url, connect_args=connect_args, **engine_args)


def init_db(engine: Engine) -> None:
    SQLModel.metadata.create_all(engine)
    _ensure_compatible_schema(engine)


def get_session(request: Request) -> Generator[Session, None, None]:
    with Session(request.app.state.engine) as session:
        yield session


def _ensure_compatible_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "formulas" in table_names:
        _ensure_columns(
            engine,
            "formulas",
            {
                "jira_project_id": _string_column_sql(engine, nullable=True),
                "jira_issue_type": _string_column_sql(engine, default="'Calidad'"),
                "jira_product_type": _string_column_sql(engine, default="'Nuevo'"),
            },
        )
    if "jira_connections" in table_names:
        _ensure_columns(
            engine,
            "jira_connections",
            {"credential_json": _json_column_sql(engine)},
        )


def _ensure_columns(engine: Engine, table_name: str, columns: dict[str, str]) -> None:
    inspector = inspect(engine)
    existing = {column["name"] for column in inspector.get_columns(table_name)}
    missing = {name: definition for name, definition in columns.items() if name not in existing}
    if not missing:
        return
    with engine.begin() as connection:
        for name, definition in missing.items():
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {definition}"))


def _string_column_sql(
    engine: Engine,
    *,
    nullable: bool = False,
    default: str | None = None,
) -> str:
    definition = "VARCHAR"
    if default is not None:
        definition += f" DEFAULT {default}"
    if not nullable:
        definition += " NOT NULL"
    return definition


def _json_column_sql(engine: Engine) -> str:
    if engine.dialect.name == "postgresql":
        return "JSONB DEFAULT '{}'::jsonb NOT NULL"
    return "JSON DEFAULT '{}' NOT NULL"
