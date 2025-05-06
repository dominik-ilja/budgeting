const fs = require("node:fs");
const { resolve } = require("node:path");
const { Readable } = require("node:stream");

const jwt = require("jsonwebtoken");
const request = require("supertest");
const express = require("express");
const betterSQLite = require("better-sqlite3");
const { TABLES, initializeTables } = require("../../database/schemas");
const {
  createGoogleSheetsCSV,
  createRouteHandler,
  formatNumber,
  ImportProfile,
  Mapping,
  parseCSV,
  createRoute,
  SQLiteImportProfileRepository,
} = require("./purchase-import-routes");

describe("formatNumber", () => {
  test.each([[""], ["abc"], ["%$#@asiut"]])(
    "Throws an error for invalid inputs: '%s'",
    (str) => {
      const result = () => formatNumber(str);

      expect(result).toThrow();
    }
  );
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
        {
          amount: "-4.75",
          category: "Food & Dining",
          date: "2025-03-20",
          description: "Coffee Shop",
        },
        {
          amount: "-52.30",
          category: "Groceries",
          date: "2025-03-19",
          description: "Grocery Store",
        },
        {
          amount: "-2500.00",
          category: "Income",
          date: "2025-03-18",
          description: "Salary Deposit",
        },
        {
          amount: "-120.50",
          category: "Utilities",
          date: "2025-03-17",
          description: "Electric Bill",
        },
        {
          amount: "-45.00",
          category: "Transport",
          date: "2025-03-16",
          description: "Gas Station",
        },
        {
          amount: "-12.99",
          category: "Entertainment",
          date: "2025-03-15",
          description: "Online Subscription",
        },
        {
          amount: "-89.99",
          category: "Shopping",
          date: "2025-03-14",
          description: "Retail Store",
        },
        {
          amount: "-27.40",
          category: "Food & Dining",
          date: "2025-03-13",
          description: "Dining Out",
        },
        {
          amount: "-500.00",
          category: "Investments",
          date: "2025-03-12",
          description: "Investment Deposit",
        },
        {
          amount: "-75.00",
          category: "Insurance",
          date: "2025-03-11",
          description: "Car Insurance",
        },
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
      {
        amount: "-4.75",
        category: "Food & Dining",
        date: "2025-03-20",
        description: "Coffee Shop",
      },
      {
        amount: "-52.30",
        category: "Groceries",
        date: "2025-03-19",
        description: "Grocery Store",
      },
      {
        amount: "-2500.00",
        category: "Income",
        date: "2025-03-18",
        description: "Salary Deposit",
      },
      {
        amount: "-120.50",
        category: "Utilities",
        date: "2025-03-17",
        description: "Electric Bill",
      },
      {
        amount: "-45.00",
        category: "Transport",
        date: "2025-03-16",
        description: "Gas Station",
      },
      {
        amount: "-12.99",
        category: "Entertainment",
        date: "2025-03-15",
        description: "Online Subscription",
      },
      {
        amount: "-89.99",
        category: "Shopping",
        date: "2025-03-14",
        description: "Retail Store",
      },
      {
        amount: "-27.40",
        category: "Food & Dining",
        date: "2025-03-13",
        description: "Dining Out",
      },
      {
        amount: "-500.00",
        category: "Investments",
        date: "2025-03-12",
        description: "Investment Deposit",
      },
      {
        amount: "-75.00",
        category: "Insurance",
        date: "2025-03-11",
        description: "Car Insurance",
      },
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

/** @param {import("better-sqlite3").Database} db */
function setupDatabase(db) {
  initializeTables(db);
  db.prepare(`INSERT INTO ${TABLES.ROLES} (name) VALUES ('admin');`).run();
  db.prepare(
    `INSERT INTO ${TABLES.USERS} (role_id, username, password)
        VALUES (1, 'username', '123abc');`
  ).run();
  db.prepare(`INSERT INTO ${TABLES.TARGET_TABLES} (name) VALUES ('purchases');`).run();
  db.prepare(
    `INSERT INTO ${TABLES.IMPORT_PROFILES} (user_id, target_table_id, name) VALUES
    (1, 1, 'Chase Checkings'),
    (1, 1, 'Chase Credit'),
    (1, 1, 'Discover Credit');`
  ).run();
  db.prepare(
    `INSERT INTO ${TABLES.COLUMN_MAPPINGS}
    (
      import_profile_id,
      column_name,
      target_column_name,
      data_type
    ) VALUES
    (1, 'Amount', 'amount', 'number'),
    (1, 'Posting Date', 'date', 'date'),
    (1, 'Description', 'description', 'string'),
    (2, 'Amount', 'amount', 'number'),
    (2, 'Category', 'category', 'string'),
    (2, 'Post Date', 'date', 'date'),
    (2, 'Description', 'description', 'string'),
    (3, 'Amount', 'amount', 'number'),
    (3, 'Category', 'category', 'string'),
    (3, 'Post Date', 'date', 'date'),
    (3, 'Description', 'description', 'string')
    ;`
  ).run();
}

describe("SQLiteImportProfileRepository", () => {
  const dbPath = resolve(__dirname, "./test.db");
  /** @type {import("better-sqlite3").Database} */
  let db = null;

  beforeEach(() => {
    db = betterSQLite(dbPath);
  });

  afterEach(() => {
    db.close();
    db = null;
    fs.rmSync(dbPath);
  });

  test("", () => {
    setupDatabase(db);
    const importProfileRepo = new SQLiteImportProfileRepository(db);
    const expected = [];

    const result = importProfileRepo.all(100);

    expect(result).toEqual(expected);
  });
  test("", () => {
    setupDatabase(db);
    const importProfileRepo = new SQLiteImportProfileRepository(db);
    const expected = [
      new ImportProfile(1, "Chase Checkings", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Posting Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
      new ImportProfile(2, "Chase Credit", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Category", "category", "string"),
        new Mapping("Post Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
      new ImportProfile(3, "Discover Credit", [
        new Mapping("Amount", "amount", "number"),
        new Mapping("Category", "category", "string"),
        new Mapping("Post Date", "date", "date"),
        new Mapping("Description", "description", "string"),
      ]),
    ];

    const result = importProfileRepo.all(1);

    expect(result).toEqual(expected);
  });
  test("", () => {
    setupDatabase(db);
    const importProfileRepo = new SQLiteImportProfileRepository(db);
    const expected = null;

    const result = importProfileRepo.getById(100, 1);

    expect(result).toEqual(expected);
  });
  test("", () => {
    setupDatabase(db);
    const importProfileRepo = new SQLiteImportProfileRepository(db);
    const expected = new ImportProfile(1, "Chase Checkings", [
      new Mapping("Amount", "amount", "number"),
      new Mapping("Posting Date", "date", "date"),
      new Mapping("Description", "description", "string"),
    ]);

    const result = importProfileRepo.getById(1, 1);

    expect(result).toEqual(expected);
  });
});

describe("createRouteHandler", () => {
  test("", async () => {
    const csv = `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
Store Purchase,2025-04-28,Grocery Store Inc.,-87.32,Debit,1254.68,
Direct Deposit,2025-04-25,ACME COMPANY PAYROLL,1500.00,Credit,1342.00,
ATM Withdrawal,2025-04-22,ATM WITHDRAWAL,-200.00,Debit,842.00,
Check Payment,2025-04-18,Payment to Landlord,-950.00,Debit,1042.00,123456
Bill Payment,2025-04-15,ELECTRIC COMPANY AUTO-PAY,-78.45,Debit,1992.00,`;
    const repository = {
      getById: (userId, profileId) => {
        return new ImportProfile(1, "Chase Checkings", [
          new Mapping("Amount", "amount", "number"),
          new Mapping("Posting Date", "date", "date"),
          new Mapping("Description", "description", "string"),
        ]);
      },
    };
    const req = {
      user: {
        id: 1,
      },
      body: {
        ImportProfileId: 1,
      },
      file: {
        buffer: Buffer.from(csv),
      },
    };
    const res = {
      send: jest.fn(),
    };
    const routeHandler = createRouteHandler(repository);
    const expected = `87.32\t2025-04-28\tGrocery Store Inc.
    1500.00\t2025-04-25\tACME COMPANY PAYROLL
    200.00\t2025-04-22\tATM WITHDRAWAL
    950.00\t2025-04-18\tPayment to Landlord
    78.45\t2025-04-15\tELECTRIC COMPANY AUTO-PAY`;

    await routeHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(expected);
  });
});

describe.only("Route", () => {
  test("", async () => {
    const file = resolve(__dirname, "./__fixtures__/chase-checkings.csv");
    const dbPath = resolve(__dirname, "./test.db");
    let db = betterSQLite(dbPath);
    const secret = "secret";
    const repository = new SQLiteImportProfileRepository(db);
    const router = createRoute(secret, repository);
    const user = { id: 1 };
    const token = jwt.sign(user, secret);
    const app = express();
    setupDatabase(db);
    app.use(express.json());
    app.use(router);

    const result = await request(app)
      .post("/")
      .set("authorization", `BEARER ${token}`)
      .attach("file", file)
      .field("importProfileId", 1);

    console.log(result.text);

    expect(result.status).toBe(200);

    db.close();
    db = null;
    fs.rmSync(dbPath);
  });
});
