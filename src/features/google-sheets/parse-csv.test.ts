import { Readable } from "node:stream";

import { Mapping } from "../../entities/mapping";
import { CsvHeaderNotFoundError, parseCsv } from "./parse-csv";

describe("parseCSV", () => {
  function createStream(s: string) {
    const stream = new Readable();
    stream.push(s);
    stream.push(null);
    return stream;
  }

  test("Stops parsing the file if there's a mismatch between the CSV headers and mapping", async () => {
    const csv = "header 1,header 2,header 3";
    const stream = createStream(csv);
    const badColumnMapping = "bad mapping";
    const mappings = [
      new Mapping("header 1", "a", "string"),
      new Mapping("header 2", "b", "string"),
      new Mapping(badColumnMapping, "c", "string"),
    ];

    const result = async () => await parseCsv(stream, mappings);

    await expect(result).rejects.toThrow(CsvHeaderNotFoundError);
  });

  test.each([
    {
      test: "CSV 1",
      csv: `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
Deposit,2025-03-20,Paycheck,1500.00,Credit,3000.00,
Withdrawal,2025-03-21,Grocery Store,-75.50,Debit,2924.50,
Withdrawal,2025-03-22,Gas Station,-40.00,Debit,2884.50,
Deposit,2025-03-23,Freelance Payment,500.00,Credit,3384.50,
Withdrawal,2025-03-24,Online Subscription,-12.99,Debit,3371.51,`,
      mappings: [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Posting Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ],
      expected: [
        { amount: "1500.00", date: "2025-03-20", description: "Paycheck" },
        { amount: "75.50", date: "2025-03-21", description: "Grocery Store" },
        { amount: "40.00", date: "2025-03-22", description: "Gas Station" },
        { amount: "500.00", date: "2025-03-23", description: "Freelance Payment" },
        { amount: "12.99", date: "2025-03-24", description: "Online Subscription" },
      ],
    },
    {
      test: "CSV 2",
      csv: `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
2025-03-20,2025-03-21,Coffee Shop,Food & Dining,Debit,4.75,Latte
2025-03-19,2025-03-19,Grocery Store,Groceries,Debit,52.30,Weekly groceries
2025-03-18,2025-03-18,Salary Deposit,Income,Credit,2500.00,March salary
2025-03-17,2025-03-18,Electric Bill,Utilities,Debit,120.50,March billing
2025-03-16,2025-03-17,Gas Station,Transport,Debit,45.00,Full tank
2025-03-15,2025-03-15,Online Subscription,Entertainment,Debit,12.99,Streaming service
2025-03-14,2025-03-14,Retail Store,Shopping,Debit,89.99,New shoes
2025-03-13,2025-03-14,Dining Out,Food & Dining,Debit,27.40,Dinner with friends
2025-03-12,2025-03-12,Investment Deposit,Investments,Credit,500.00,Monthly contribution
2025-03-11,2025-03-11,Car Insurance,Insurance,Debit,75.00,Quarterly payment`,
      mappings: [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Category", "category", "string"),
        new Mapping("Transaction Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ],
      expected: [
        {
          amount: "4.75",
          category: "Food & Dining",
          date: "2025-03-20",
          description: "Coffee Shop",
        },
        {
          amount: "52.30",
          category: "Groceries",
          date: "2025-03-19",
          description: "Grocery Store",
        },
        {
          amount: "2500.00",
          category: "Income",
          date: "2025-03-18",
          description: "Salary Deposit",
        },
        {
          amount: "120.50",
          category: "Utilities",
          date: "2025-03-17",
          description: "Electric Bill",
        },
        {
          amount: "45.00",
          category: "Transport",
          date: "2025-03-16",
          description: "Gas Station",
        },
        {
          amount: "12.99",
          category: "Entertainment",
          date: "2025-03-15",
          description: "Online Subscription",
        },
        {
          amount: "89.99",
          category: "Shopping",
          date: "2025-03-14",
          description: "Retail Store",
        },
        {
          amount: "27.40",
          category: "Food & Dining",
          date: "2025-03-13",
          description: "Dining Out",
        },
        {
          amount: "500.00",
          category: "Investments",
          date: "2025-03-12",
          description: "Investment Deposit",
        },
        {
          amount: "75.00",
          category: "Insurance",
          date: "2025-03-11",
          description: "Car Insurance",
        },
      ],
    },
  ])(
    "$test - Returns all the rows of the CSV files",
    async ({ csv, expected, mappings }) => {
      const stream = createStream(csv);

      const rows = await parseCsv(stream, mappings);

      expect(rows).toEqual(expected);
    }
  );
});
