from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Any

from openpyxl import load_workbook
from openpyxl.cell.cell import Cell


class ExcelImportError(ValueError):
    pass


@dataclass(frozen=True)
class DetectedColumns:
    material_name: str | None
    material_code: str | None
    percentage: str
    material_name_index: int | None
    material_code_index: int | None
    percentage_index: int | None


@dataclass(frozen=True)
class ColumnMapping:
    material_name: str | None = None
    material_code: str | None = None
    percentage: str | None = None


@dataclass(frozen=True)
class WorksheetColumns:
    sheet_name: str
    available_sheets: list[str]
    header_row: int
    columns: list[str]
    detected_material_name: str | None
    detected_material_code: str | None
    detected_percentage: str | None


@dataclass(frozen=True)
class ParsedFormulaRow:
    row_number: int
    material_name: str | None
    material_code: str | None
    percentage: float | None
    status: str
    message: str | None = None


@dataclass(frozen=True)
class ParsedFormulaImport:
    sheet_name: str
    available_sheets: list[str]
    columns: DetectedColumns
    rows: list[ParsedFormulaRow]

    @property
    def total_percentage(self) -> float:
        return sum(row.percentage or 0 for row in self.rows)


MATERIAL_NAME_HEADERS = {
    "materia prima",
    "ingrediente",
    "raw material",
    "material",
    "mp",
    "componente",
    "nombre",
    "name",
}
MATERIAL_CODE_HEADERS = {
    "codigo",
    "código",
    "code",
    "cod",
    "sku",
    "referencia",
    "reference",
}
PERCENTAGE_HEADERS = {
    "%",
    "porcentaje",
    "percentage",
    "cantidad %",
    "dosificacion",
    "dosificación",
    "share",
}


def list_formula_xlsx_sheets(content: bytes) -> list[str]:
    workbook = _load_formula_workbook(content)
    return list(workbook.sheetnames)


def list_formula_xlsx_columns(
    content: bytes,
    sheet_name: str | None = None,
) -> WorksheetColumns:
    workbook = _load_formula_workbook(content)
    worksheet = _select_worksheet(workbook, sheet_name)
    rows = list(worksheet.iter_rows())
    if not rows:
        raise ExcelImportError("XLSX file is empty.")
    header_index, columns = _find_candidate_header_row(rows)
    detected = _detect_columns(_normalized_headers(rows[header_index]), require_complete=False)
    return WorksheetColumns(
        sheet_name=worksheet.title,
        available_sheets=list(workbook.sheetnames),
        header_row=header_index + 1,
        columns=columns,
        detected_material_name=_header_value(rows[header_index], detected.material_name_index),
        detected_material_code=_header_value(rows[header_index], detected.material_code_index),
        detected_percentage=_header_value(rows[header_index], detected.percentage_index),
    )


def parse_formula_xlsx(
    content: bytes,
    sheet_name: str | None = None,
    column_mapping: ColumnMapping | None = None,
) -> ParsedFormulaImport:
    workbook = _load_formula_workbook(content)
    worksheet = _select_worksheet(workbook, sheet_name)
    rows = list(worksheet.iter_rows())
    if not rows:
        raise ExcelImportError("XLSX file is empty.")

    header_index, headers = _find_header_row(rows, column_mapping=column_mapping)
    columns = _detect_columns(headers, column_mapping=column_mapping)
    parsed_rows = [
        parsed
        for row in rows[header_index + 1 :]
        if (parsed := _parse_row(row, columns)) is not None
    ]
    if not parsed_rows:
        raise ExcelImportError("No formula rows were found.")

    return ParsedFormulaImport(
        sheet_name=worksheet.title,
        available_sheets=list(workbook.sheetnames),
        columns=columns,
        rows=parsed_rows,
    )


def _load_formula_workbook(content: bytes):
    try:
        return load_workbook(BytesIO(content), read_only=True, data_only=True)
    except Exception as exc:  # pragma: no cover - openpyxl error types vary
        raise ExcelImportError("Could not read XLSX file.") from exc


def _select_worksheet(workbook, sheet_name: str | None):
    if sheet_name is None:
        return workbook.active
    selected = sheet_name.strip()
    if not selected:
        return workbook.active
    if selected not in workbook.sheetnames:
        raise ExcelImportError(f"Worksheet '{selected}' was not found.")
    return workbook[selected]


def _find_header_row(
    rows: list[tuple[Cell, ...]],
    column_mapping: ColumnMapping | None = None,
) -> tuple[int, dict[int, str]]:
    if _has_column_mapping(column_mapping):
        return _find_mapped_header_row(rows, column_mapping)
    for index, row in enumerate(rows[:10]):
        headers = _normalized_headers(row)
        if headers and _detect_columns(headers, require_complete=False).percentage:
            return index, headers
    raise ExcelImportError("Could not detect header row.")


def _find_mapped_header_row(
    rows: list[tuple[Cell, ...]],
    column_mapping: ColumnMapping | None,
) -> tuple[int, dict[int, str]]:
    for index, row in enumerate(rows[:10]):
        headers = _normalized_headers(row)
        if headers and _mapping_matches_headers(headers, column_mapping):
            return index, headers
    raise ExcelImportError("Could not detect mapped header row.")


def _find_candidate_header_row(rows: list[tuple[Cell, ...]]) -> tuple[int, list[str]]:
    for index, row in enumerate(rows[:10]):
        columns = [
            str(cell.value).strip()
            for cell in row
            if cell.value is not None and str(cell.value).strip()
        ]
        if len(columns) >= 2:
            return index, columns
    raise ExcelImportError("Could not detect header row.")


def _normalized_headers(row: tuple[Cell, ...]) -> dict[int, str]:
    return {
        position: _normalize_header(cell.value)
        for position, cell in enumerate(row)
        if _normalize_header(cell.value)
    }


def _detect_columns(
    headers: dict[int, str],
    *,
    require_complete: bool = True,
    column_mapping: ColumnMapping | None = None,
) -> DetectedColumns:
    if _has_column_mapping(column_mapping):
        material_name_index = _find_mapped_column(headers, column_mapping.material_name)
        material_code_index = _find_mapped_column(headers, column_mapping.material_code)
        percentage_index = _find_mapped_column(headers, column_mapping.percentage)
    else:
        material_name_index = _find_column(headers, MATERIAL_NAME_HEADERS)
        material_code_index = _find_column(headers, MATERIAL_CODE_HEADERS)
        percentage_index = _find_column(headers, PERCENTAGE_HEADERS)

    if require_complete:
        if material_name_index is None and material_code_index is None:
            raise ExcelImportError("Could not detect material name or code column.")
        if percentage_index is None:
            raise ExcelImportError("Could not detect percentage column.")

    return DetectedColumns(
        material_name=_column_name(headers, material_name_index),
        material_code=_column_name(headers, material_code_index),
        percentage=_column_name(headers, percentage_index) or "",
        material_name_index=material_name_index,
        material_code_index=material_code_index,
        percentage_index=percentage_index,
    )


def _parse_row(row: tuple[Cell, ...], columns: DetectedColumns) -> ParsedFormulaRow | None:
    material_name = _text_at(row, columns.material_name_index)
    material_code = _text_at(row, columns.material_code_index)
    if material_name is None and material_code is None:
        return None

    percentage_cell = _cell_at(row, columns.percentage_index)
    percentage = _parse_percentage(
        percentage_cell.value if percentage_cell else None,
        percentage_cell.number_format if percentage_cell else None,
    )
    if percentage is None:
        return ParsedFormulaRow(
            row_number=row[0].row,
            material_name=material_name,
            material_code=material_code,
            percentage=None,
            status="invalid_percentage",
            message="Percentage is missing or invalid.",
        )
    if percentage < 0:
        return ParsedFormulaRow(
            row_number=row[0].row,
            material_name=material_name,
            material_code=material_code,
            percentage=percentage,
            status="invalid_percentage",
            message="Percentage cannot be negative.",
        )

    return ParsedFormulaRow(
        row_number=row[0].row,
        material_name=material_name,
        material_code=material_code,
        percentage=percentage,
        status="parsed",
    )


def _find_column(headers: dict[int, str], aliases: set[str]) -> int | None:
    for index, header in headers.items():
        if header in aliases:
            return index
    return None


def _find_mapped_column(headers: dict[int, str], value: str | None) -> int | None:
    if value is None:
        return None
    normalized = _normalize_header(value)
    if not normalized:
        return None
    for index, header in headers.items():
        if header == normalized:
            return index
    return None


def _has_column_mapping(column_mapping: ColumnMapping | None) -> bool:
    return bool(
        column_mapping
        and (
            column_mapping.material_name
            or column_mapping.material_code
            or column_mapping.percentage
        )
    )


def _mapping_matches_headers(
    headers: dict[int, str],
    column_mapping: ColumnMapping | None,
) -> bool:
    if column_mapping is None:
        return False
    has_material = _find_mapped_column(headers, column_mapping.material_name) is not None
    has_code = _find_mapped_column(headers, column_mapping.material_code) is not None
    has_percentage = _find_mapped_column(headers, column_mapping.percentage) is not None
    return (has_material or has_code) and has_percentage


def _column_name(headers: dict[int, str], index: int | None) -> str | None:
    if index is None:
        return None
    return headers[index]


def _header_value(row: tuple[Cell, ...], index: int | None) -> str | None:
    if index is None or index >= len(row):
        return None
    value = row[index].value
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _cell_at(row: tuple[Cell, ...], index: int | None) -> Cell | None:
    if index is None or index >= len(row):
        return None
    return row[index]


def _text_at(row: tuple[Cell, ...], index: int | None) -> str | None:
    cell = _cell_at(row, index)
    if cell is None or cell.value is None:
        return None
    value = str(cell.value).strip()
    return value or None


def _parse_percentage(value: Any, number_format: str | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip().replace(",", ".")
        if not stripped:
            return None
        has_percent = stripped.endswith("%")
        stripped = stripped.rstrip("%").strip()
        try:
            parsed = float(stripped)
        except ValueError:
            return None
        return parsed if has_percent else parsed
    if isinstance(value, int | float):
        parsed = float(value)
        if number_format and "%" in number_format and abs(parsed) <= 1:
            return parsed * 100
        return parsed
    return None


def _normalize_header(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().lower().split())
