const { Readable } = require("stream");
const { parseCSV, formatNumber, createGoogleSheetsCSV } = require("./purchase-import-routes");

describe("formatNumber", () => {
  test.each([[""], ["abc"], ["%$#@asiut"]])("Throws an error for invalid inputs: '%s'", (str) => {
    const result = () => formatNumber(str);

    expect(result).toThrow();
  });
  test.each([
    ["500.00", "-500.00"],
    ["1500", "-1500.00"],
    ["-75.5", "75.50"],
    ["-40", "40.00"],
    ["-12.99", "12.99"],
  ])("Formats numbers correctly: '%s' -> '%s'", (str, expected) => {
    const result = formatNumber(str);

    expect(result).toBe(expected);
  });
});

describe("parseCSV", () => {
  /**
   * @param {string} column
   * @param {string} target
   * @param {"date" | "number" | "string"} type
   */
  function createMapping(column, target, type) {
    return { column, target, type };
  }
  function createStream(str) {
    const stream = new Readable();
    stream.push(str);
    stream.push(null);
    return stream;
  }

  test("Stops parsing the file if there's a mismatch between the CSV headers and mapping", async () => {
    const csv = "header 1,header 2,header 3";
    const stream = createStream(csv);
    const mappings = [
      { column: "header 1", target: "a", type: "string" },
      { column: "header 2", target: "b", type: "string" },
      { column: "header3", target: "c", type: "string" },
    ];

    const result = async () => await parseCSV(stream, mappings);

    await expect(result).rejects.toThrow('Headers not found in file: "header3"');
  });

  test.each([
    [
      "CSV 1",
      `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
Deposit,2025-03-20,Paycheck,1500.00,Credit,3000.00,
Withdrawal,2025-03-21,Grocery Store,-75.50,Debit,2924.50,
Withdrawal,2025-03-22,Gas Station,-40.00,Debit,2884.50,
Deposit,2025-03-23,Freelance Payment,500.00,Credit,3384.50,
Withdrawal,2025-03-24,Online Subscription,-12.99,Debit,3371.51,`,
      [
        createMapping("Amount", "amount", "number"),
        createMapping("Posting Date", "date", "date"),
        createMapping("Description", "description", "string"),
      ],
      [
        { amount: "-1500.00", date: "2025-03-20", description: "Paycheck" },
        { amount: "75.50", date: "2025-03-21", description: "Grocery Store" },
        { amount: "40.00", date: "2025-03-22", description: "Gas Station" },
        { amount: "-500.00", date: "2025-03-23", description: "Freelance Payment" },
        { amount: "12.99", date: "2025-03-24", description: "Online Subscription" },
      ],
    ],
    [
      "CSV 2",
      `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
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
      [
        createMapping("Amount", "amount", "number"),
        createMapping("Category", "category", "string"),
        createMapping("Transaction Date", "date", "date"),
        createMapping("Description", "description", "string"),
      ],
      [
        { amount: "-4.75", category: "Food & Dining", date: "2025-03-20", description: "Coffee Shop" },
        { amount: "-52.30", category: "Groceries", date: "2025-03-19", description: "Grocery Store" },
        { amount: "-2500.00", category: "Income", date: "2025-03-18", description: "Salary Deposit" },
        { amount: "-120.50", category: "Utilities", date: "2025-03-17", description: "Electric Bill" },
        { amount: "-45.00", category: "Transport", date: "2025-03-16", description: "Gas Station" },
        { amount: "-12.99", category: "Entertainment", date: "2025-03-15", description: "Online Subscription" },
        { amount: "-89.99", category: "Shopping", date: "2025-03-14", description: "Retail Store" },
        { amount: "-27.40", category: "Food & Dining", date: "2025-03-13", description: "Dining Out" },
        { amount: "-500.00", category: "Investments", date: "2025-03-12", description: "Investment Deposit" },
        { amount: "-75.00", category: "Insurance", date: "2025-03-11", description: "Car Insurance" },
      ],
    ],
  ])("Returns all the rows of the CSV file: %s", async (_, csv, mappings, expected) => {
    const stream = createStream(csv);

    const rows = await parseCSV(stream, mappings);

    expect(rows).toEqual(expected);
  });
});

describe("createGoogleSheetsCSV", () => {
  test("Formats the input correctly", () => {
    const rows = [
      { amount: "-4.75", category: "Food & Dining", date: "2025-03-20", description: "Coffee Shop" },
      { amount: "-52.30", category: "Groceries", date: "2025-03-19", description: "Grocery Store" },
      { amount: "-2500.00", category: "Income", date: "2025-03-18", description: "Salary Deposit" },
      { amount: "-120.50", category: "Utilities", date: "2025-03-17", description: "Electric Bill" },
      { amount: "-45.00", category: "Transport", date: "2025-03-16", description: "Gas Station" },
      { amount: "-12.99", category: "Entertainment", date: "2025-03-15", description: "Online Subscription" },
      { amount: "-89.99", category: "Shopping", date: "2025-03-14", description: "Retail Store" },
      { amount: "-27.40", category: "Food & Dining", date: "2025-03-13", description: "Dining Out" },
      { amount: "-500.00", category: "Investments", date: "2025-03-12", description: "Investment Deposit" },
      { amount: "-75.00", category: "Insurance", date: "2025-03-11", description: "Car Insurance" },
    ];
    expected = `-4.75\tFood & Dining\t2025-03-20\tCoffee Shop
-52.30\tGroceries\t2025-03-19\tGrocery Store
-2500.00\tIncome\t2025-03-18\tSalary Deposit
-120.50\tUtilities\t2025-03-17\tElectric Bill
-45.00\tTransport\t2025-03-16\tGas Station
-12.99\tEntertainment\t2025-03-15\tOnline Subscription
-89.99\tShopping\t2025-03-14\tRetail Store
-27.40\tFood & Dining\t2025-03-13\tDining Out
-500.00\tInvestments\t2025-03-12\tInvestment Deposit
-75.00\tInsurance\t2025-03-11\tCar Insurance`;

    const result = createGoogleSheetsCSV(rows);

    expect(result).toBe(expected);
  });
});
