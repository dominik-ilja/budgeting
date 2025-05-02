const { Readable } = require("stream");
const { parseCSV } = require("./purchase-import-routes");

describe("parseCSV", () => {
  test("Stops parsing the file if there's a mismatch between the CSV headers and mapping", async () => {
    const headers = "header 1,header 2,header 3";
    const stream = new Readable();
    const mapping = { "header 1": "", "header 2": "", header3: "" };
    stream.push(headers);
    stream.push(null);

    const result = async () => await parseCSV(stream, mapping);

    await expect(result).rejects.toThrow('Headers not found in file: "header3"');
  });
  test.todo("Returns all the rows of the CSV file");
});
