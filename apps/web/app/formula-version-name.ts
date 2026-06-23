export function suggestNextFormulaVersionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Nueva formula - F2";
  }

  const matches = [...trimmed.matchAll(/\bF(\d+)\b/gi)];
  const lastMatch = matches.at(-1);
  if (!lastMatch || lastMatch.index === undefined) {
    return `${trimmed} - F2`;
  }

  const versionText = lastMatch[1];
  const nextVersion = String(Number(versionText) + 1).padStart(versionText.length, "0");
  const start = lastMatch.index;
  const end = start + lastMatch[0].length;

  return `${trimmed.slice(0, start)}F${nextVersion}${trimmed.slice(end)}`;
}
