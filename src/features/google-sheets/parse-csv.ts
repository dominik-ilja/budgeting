import type { Readable } from "node:stream";

import csv from "csv-parser";

import type { Mapping } from "../../entities/mapping";

/**
 * @throws {Error} If input cannot be parsed to a float
 */
export function formatCsvNumber(str: string) {
  let num = parseFloat(str);

  if (Number.isNaN(num)) {
    const msg = `The string "${str}" could not be converted to a number`;
    throw new Error(msg);
  }

  num = Math.abs(num);

  const value = num.toFixed(2);
  const parts = value.split(".");
  const decimal = parts[1];

  if (!decimal) {
    return value + ".00";
  }
  if (decimal.length === 1) {
    return value + "0";
  }
  return value;
}

export class CsvHeaderNotFoundError extends Error {
  constructor(headers: string[]) {
    const message = `Headers not found in CSV: [${headers.join(", ")}]`;
    super(message);
    this.name = "CSVHeaderNotFoundError";
  }
}

export async function parseCsv(
  stream: Readable,
  mappings: Mapping[]
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, any>[] = [];

    const parser = csv()
      .on("headers", (headers) => {
        const notFound = mappings
          .filter(({ column }) => !headers.includes(column))
          .map((e) => e.column);

        if (notFound.length > 0) {
          const error = new CsvHeaderNotFoundError(notFound);
          parser.destroy(error);
        }
      })
      .on("data", (row: Record<string, any>) => {
        const entry: Record<string, any> = {};
        for (const { column, target, type } of mappings) {
          let value = row[column];

          if (type === "number") value = formatCsvNumber(value);

          entry[target] = value;
        }
        rows.push(entry);
      })
      .on("error", (error) => {
        stream.destroy();
        reject(error);
      })
      .on("end", () => resolve(rows));

    stream.pipe(parser);
  });
}
