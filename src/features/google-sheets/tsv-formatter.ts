export function formatRowsAsTsv(rows: Record<string, any>[]) {
  return rows.map((row) => Object.values(row).join("\t")).join("\n");
}
