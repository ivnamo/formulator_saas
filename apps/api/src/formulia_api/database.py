from __future__ import annotations

import os
import re
from collections.abc import Generator

from fastapi import Request
from sqlalchemy import Engine, inspect, text
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine


def create_db_engine(database_url: str | None = None) -> Engine:
    url = _normalize_database_url(
        database_url or os.getenv("DATABASE_URL", "sqlite:///./formulia.db")
    )
    connect_args = {}
    engine_args = {}
    schema = None

    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if url in {"sqlite://", "sqlite:///:memory:"}:
            engine_args["poolclass"] = StaticPool
    elif url.startswith("postgresql"):
        schema = _configured_postgres_schema()
        if schema is not None:
            connect_args["options"] = f"-csearch_path={schema},public"

    engine = create_engine(url, connect_args=connect_args, **engine_args)
    if schema is not None:
        engine.update_execution_options(schema_translate_map={None: schema})
    return engine


def init_db(engine: Engine) -> None:
    _ensure_postgres_schema(engine)
    SQLModel.metadata.create_all(engine)
    _ensure_compatible_schema(engine)


def get_session(request: Request) -> Generator[Session, None, None]:
    with Session(request.app.state.engine) as session:
        yield session


def _ensure_compatible_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    schema = _inspected_schema(engine)
    table_names = set(inspector.get_table_names(schema=schema))
    if "formulas" in table_names:
        _ensure_columns(
            engine,
            "formulas",
            {
                "jira_project_id": _string_column_sql(engine, nullable=True),
                "jira_issue_type": _string_column_sql(engine, default="'Calidad'"),
                "jira_product_type": _string_column_sql(engine, default="'Nuevo'"),
            },
            schema=schema,
        )
    if "jira_connections" in table_names:
        _ensure_columns(
            engine,
            "jira_connections",
            {"credential_json": _json_column_sql(engine)},
            schema=schema,
        )
    if "tenant_invitations" in table_names:
        _ensure_unique_constraint(
            engine,
            "tenant_invitations",
            "uq_tenant_invitations_tenant_email",
            ["tenant_id", "email"],
            schema=schema,
        )


def _ensure_columns(
    engine: Engine,
    table_name: str,
    columns: dict[str, str],
    *,
    schema: str | None = None,
) -> None:
    inspector = inspect(engine)
    existing = {
        column["name"] for column in inspector.get_columns(table_name, schema=schema)
    }
    missing = {name: definition for name, definition in columns.items() if name not in existing}
    if not missing:
        return
    with engine.begin() as connection:
        qualified_table = _qualified_table_name(engine, table_name, schema)
        for name, definition in missing.items():
            connection.execute(
                text(
                    f"ALTER TABLE {qualified_table} "
                    f"ADD COLUMN {_quote_identifier(name)} {definition}"
                )
            )


def _ensure_unique_constraint(
    engine: Engine,
    table_name: str,
    constraint_name: str,
    columns: list[str],
    *,
    schema: str | None = None,
) -> None:
    if engine.dialect.name != "postgresql":
        return

    inspected_schema = schema or "public"
    with engine.begin() as connection:
        exists = connection.execute(
            text(
                """
                select exists (
                    select 1
                    from pg_constraint c
                    join pg_namespace n on n.oid = c.connamespace
                    where c.conname = :constraint_name
                    and n.nspname = :schema_name
                )
                """
            ),
            {"constraint_name": constraint_name, "schema_name": inspected_schema},
        ).scalar_one()
        if exists:
            return

        qualified_table = _qualified_table_name(engine, table_name, schema)
        quoted_columns = ", ".join(_quote_identifier(column) for column in columns)
        connection.execute(
            text(
                f"ALTER TABLE {qualified_table} "
                f"ADD CONSTRAINT {_quote_identifier(constraint_name)} UNIQUE ({quoted_columns})"
            )
        )


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


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


def _configured_postgres_schema() -> str | None:
    schema = os.getenv("FORMULIA_DB_SCHEMA", "").strip()
    if not schema or schema == "public":
        return None
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", schema):
        raise ValueError("FORMULIA_DB_SCHEMA must be a valid PostgreSQL identifier.")
    return schema


def _ensure_postgres_schema(engine: Engine) -> None:
    if engine.dialect.name != "postgresql":
        return

    schema = _configured_postgres_schema()
    if schema is None:
        return

    with engine.begin() as connection:
        exists = connection.execute(
            text("select to_regnamespace(:schema_name) is not null"),
            {"schema_name": schema},
        ).scalar_one()
        if not exists:
            connection.execute(text(f"CREATE SCHEMA {_quote_identifier(schema)}"))
        connection.execute(text(f"SET search_path TO {_quote_identifier(schema)}, public"))


def _inspected_schema(engine: Engine) -> str | None:
    if engine.dialect.name == "postgresql":
        return _configured_postgres_schema()
    return None


def _qualified_table_name(engine: Engine, table_name: str, schema: str | None) -> str:
    if engine.dialect.name == "postgresql" and schema is not None:
        return f"{_quote_identifier(schema)}.{_quote_identifier(table_name)}"
    return _quote_identifier(table_name)


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'
