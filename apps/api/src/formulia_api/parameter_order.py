from __future__ import annotations

import re
import unicodedata
from collections.abc import Callable, Iterable
from typing import TypeVar

PARAMETER_ORDER = [
    "Ntotal",
    "Norg",
    "Nnitr",
    "Nure",
    "Namo",
    "K2O",
    "P2O5",
    "CaO",
    "MgO",
    "SO3",
    "Zn",
    "Mn",
    "Fe",
    "Cu",
    "B",
    "Mo",
    "Co",
    "SiO2",
    "Mseca",
    "Morg",
    "Corg",
    "Extracto Húmico total",
    "Acidos fulvicos",
    "Acidos húmicos",
    "Extracto de Algas",
    "Polisacaridos",
    "Sum AA totales",
    "Sum AA libres",
    "Ac aspartico",
    "Ac glutamico",
    "Alanina",
    "Glicina",
    "Histidina",
    "Isoleucina",
    "Leucina",
    "Lisina",
    "Serina",
    "Tirosina",
    "Treonina",
    "Valina",
    "Arginina",
    "Fenilalanina",
    "Metionina",
    "Prolina",
    "Hidroxiprolina",
    "Triptofano",
    "As",
    "Hg",
    "Pb",
    "Cd",
    "Cr",
    "Ni",
]

T = TypeVar("T")


def normalize_parameter_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.strip().casefold())
    without_marks = "".join(
        character for character in normalized if unicodedata.category(character) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", "", without_marks)


_PARAMETER_INDEX = {
    normalize_parameter_key(code): index for index, code in enumerate(PARAMETER_ORDER)
}


def parameter_sort_key(value: str) -> tuple[int, str]:
    normalized = normalize_parameter_key(value)
    return (_PARAMETER_INDEX.get(normalized, 10_000), normalized)


def sort_parameters(
    parameters: Iterable[T],
    key: Callable[[T], str],
) -> list[T]:
    return sorted(parameters, key=lambda parameter: parameter_sort_key(key(parameter)))
