export class CsvHeaderNotFoundError extends Error {
  constructor(headers: string[]) {
    const message = `Headers not found in CSV: [${headers.join(", ")}]`;
    super(message);
    this.name = "CSVHeaderNotFoundError";
  }
}
