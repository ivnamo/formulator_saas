from __future__ import annotations

import os
import re
from collections.abc import Generator

from fastapi import Request
from sqlalchemy import Engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
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
        connect_args["prepare_threshold"] = None
        engine_args["pool_pre_ping"] = True
        engine_args["pool_size"] = int(os.getenv("FORMULIA_DB_POOL_SIZE", "1"))
        engine_args["max_overflow"] = int(os.getenv("FORMULIA_DB_MAX_OVERFLOW", "0"))
        engine_args["pool_timeout"] = int(os.getenv("FORMULIA_DB_POOL_TIMEOUT", "10"))
        engine_args["pool_recycle"] = int(os.getenv("FORMULIA_DB_POOL_RECYCLE", "300"))
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
                "source_formula_id": _uuid_column_sql(engine, nullable=True),
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
    if "iso_design_projects" in table_names:
        _ensure_iso_design_projects_unique_constraint(engine, schema=schema)


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


def _ensure_iso_design_projects_unique_constraint(
    engine: Engine,
    *,
    schema: str | None = None,
) -> None:
    target_columns = ["tenant_id", "year", "iso_request_number", "project_code"]
    if engine.dialect.name == "sqlite":
        _ensure_sqlite_iso_design_projects_unique_constraint(engine)
        return
    if engine.dialect.name != "postgresql":
        return

    inspected_schema = schema or "public"
    with engine.begin() as connection:
        old_constraints = connection.execute(
            text(
                """
                select c.conname
                from pg_constraint c
                join pg_class t on t.oid = c.conrelid
                join pg_namespace n on n.oid = t.relnamespace
                where t.relname = 'iso_design_projects'
                and n.nspname = :schema_name
                and c.contype = 'u'
                and (
                    select array_agg(a.attname::text order by k.ordinality)
                    from unnest(c.conkey) with ordinality as k(attnum, ordinality)
                    join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
                ) = array['tenant_id', 'year', 'iso_request_number']
                """
            ),
            {"schema_name": inspected_schema},
        ).all()
        qualified_table = _qualified_table_name(engine, "iso_design_projects", schema)
        for (constraint_name,) in old_constraints:
            connection.execute(
                text(
                    f"ALTER TABLE {qualified_table} "
                    f"DROP CONSTRAINT {_quote_identifier(constraint_name)}"
                )
            )
    _ensure_unique_constraint(
        engine,
        "iso_design_projects",
        "uq_iso_design_projects_request_code",
        target_columns,
        schema=schema,
    )
    _ensure_unique_index(
        engine,
        "iso_design_projects",
        "ix_iso_design_projects_tenant_project_code_unique",
        ["tenant_id", "project_code"],
        where="project_code is not null",
        schema=schema,
    )


def _ensure_unique_index(
    engine: Engine,
    table_name: str,
    index_name: str,
    columns: list[str],
    *,
    where: str | None = None,
    schema: str | None = None,
) -> None:
    if engine.dialect.name != "postgresql":
        return

    inspected_schema = schema or "public"
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        index_is_valid = connection.execute(
            text(
                """
                select i.indisvalid
                from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                join pg_index i on i.indexrelid = c.oid
                where c.relname = :index_name
                and n.nspname = :schema_name
                """
            ),
            {"index_name": index_name, "schema_name": inspected_schema},
        ).scalar_one_or_none()
        if index_is_valid is True:
            return
        qualified_table = _qualified_table_name(engine, table_name, schema)
        quoted_index = _quote_identifier(index_name)
        quoted_columns = ", ".join(_quote_identifier(column) for column in columns)
        where_clause = f" WHERE {where}" if where else ""
        try:
            connection.execute(text("SET statement_timeout = '5000ms'"))
        except SQLAlchemyError:
            pass
        if index_is_valid is False:
            try:
                connection.execute(text(f"DROP INDEX CONCURRENTLY IF EXISTS {quoted_index}"))
            except SQLAlchemyError:
                return
        try:
            connection.execute(
                text(
                    f"CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS {quoted_index} "
                    f"ON {qualified_table} ({quoted_columns}){where_clause}"
                )
            )
        except SQLAlchemyError:
            return


def _ensure_sqlite_iso_design_projects_unique_constraint(engine: Engine) -> None:
    with engine.begin() as connection:
        old_unique_exists = connection.execute(
            text(
                """
                select 1
                from pragma_index_list('iso_design_projects') indexes
                where indexes.[unique] = 1
                and indexes.origin = 'u'
                and (
                    select group_concat(info.name, ',')
                    from pragma_index_info(indexes.name) info
                    order by info.seqno
                ) = 'tenant_id,year,iso_request_number'
                limit 1
                """
            )
        ).first()
        if old_unique_exists is None:
            return
        create_sql = connection.execute(
            text(
                """
                select sql
                from sqlite_master
                where type = 'table'
                and name = 'iso_design_projects'
                """
            )
        ).scalar_one()
        index_sql = connection.execute(
            text(
                """
                select sql
                from sqlite_master
                where type = 'index'
                and tbl_name = 'iso_design_projects'
                and sql is not null
                """
            )
        ).scalars().all()
        next_create_sql = create_sql.replace(
            "CREATE TABLE iso_design_projects",
            "CREATE TABLE iso_design_projects_new",
            1,
        ).replace(
            "CONSTRAINT uq_iso_design_projects_request UNIQUE (tenant_id, year, iso_request_number)",
            "CONSTRAINT uq_iso_design_projects_request_code UNIQUE (tenant_id, year, iso_request_number, project_code)",
        )
        columns = [
            row[1]
            for row in connection.execute(text("PRAGMA table_info('iso_design_projects')")).all()
        ]
        quoted_columns = ", ".join(_quote_identifier(column) for column in columns)
        connection.execute(text("PRAGMA foreign_keys=OFF"))
        connection.execute(text(next_create_sql))
        connection.execute(
            text(
                f"INSERT INTO iso_design_projects_new ({quoted_columns}) "
                f"SELECT {quoted_columns} FROM iso_design_projects"
            )
        )
        connection.execute(text("DROP TABLE iso_design_projects"))
        connection.execute(
            text("ALTER TABLE iso_design_projects_new RENAME TO iso_design_projects")
        )
        for statement in index_sql:
            connection.execute(text(statement))
        connection.execute(text("PRAGMA foreign_keys=ON"))


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


def _uuid_column_sql(engine: Engine, *, nullable: bool = False) -> str:
    definition = "UUID" if engine.dialect.name == "postgresql" else "CHAR(32)"
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
