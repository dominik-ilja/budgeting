/**
 * @param {string} csv
 * @param {{amount: number, category: string | null, date: Date, description: string}} mapping
 */
function parseTransactionsCSV(csv, mapping) {
  const text = csv.replaceAll("\r\n", "\n").trim();
  const lines = text.split("\n");
  const headers = lines[0].split(",");

  const indexes = {
    date: null,
    description: null,
    category: null,
    amount: null,
  };
  headers.forEach((header, idx) => {
    if (header === mapping.date) indexes.date = idx;
    else if (header === mapping.description) indexes.description = idx;
    else if (header === mapping.category) indexes.category = idx;
    else if (header === mapping.amount) indexes.amount = idx;
  });

  const unmapped = [];
  Object.entries(indexes).forEach(([key, value]) => {
    // todo - update
    if (value != null || (key === "category" && value === mapping.category)) return;
    unmapped.push(key);
  });
  if (unmapped.length !== 0) {
    throw new Error(`There were no headers that mapped to: ${unmapped.join(", ")}`);
  }

  // todo - confirm that fields map correct data type:
  // amount -> number
  // category -> string
  // date -> string
  // description -> string
  const body = lines.slice(1).map((line) => line.split(","));
  const entries = body
    .map((line) => {
      const date = line[indexes.date];
      const description = line[indexes.description];
      const category = line[indexes.category] ?? "";
      const amount = Math.abs(parseFloat(line[indexes.amount]));

      return `${date}\t${description}\t${amount}\t${category}`;
    })
    .join("\n");

  return entries;
}

module.exports = { parseTransactionsCSV };
