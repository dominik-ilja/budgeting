export function formatRowsAsTsv(
  rows: Record<string, any>[],
  order?: Record<string, number | undefined>
) {
  if (order == null) {
    return rows.map((row) => Object.values(row).join("\t")).join("\n");
  }

  return rows
    .map((row) =>
      Object.entries(row)
        .sort((a, b) => {
          const aKey = a[0];
          const bKey = b[0];
          const aVal = order[aKey];
          const bVal = order[bKey];

          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          return aVal - bVal;
        })
        .map((entry) => entry[1])
        .join("\t")
    )
    .join("\n");
}
