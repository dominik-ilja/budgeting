const fs = require("node:fs");
const { join, resolve } = require("node:path");
const { parseTransactionsCSV } = require("./parse-transactions-csv");

const MAPPINGS = {
  CHASE_CHECKINGS: {
    amount: "Amount",
    category: null,
    date: "Posting Date",
    description: "Description",
  },
  CHASE_CREDIT: {
    amount: "Amount",
    category: "Category",
    date: "Post Date",
    description: "Description",
  },
  DISCOVER: {
    amount: "Amount",
    category: "Category",
    date: "Post Date",
    description: "Description",
  },
  ALL_NULL: {
    amount: null,
    category: null,
    date: null,
    description: null,
  },
};
const FIXTURES_PATH = resolve(__dirname, "./__fixtures__");
const chaseCheckingCSV = fs
  .readFileSync(join(FIXTURES_PATH, "chase-checkings.csv"))
  .toString();
const chaseCreditCSV = fs
  .readFileSync(join(FIXTURES_PATH, "chase-credit-card.csv"))
  .toString();
const discoverCSV = fs
  .readFileSync(join(FIXTURES_PATH, "discover-credit-card.csv"))
  .toString();

it("should throw an error when any index except category is null", () => {
  const result = () => parseTransactionsCSV(chaseCheckingCSV, MAPPINGS.ALL_NULL);
  expect(result).toThrow(
    new Error("There were no headers that mapped to: date, description, amount")
  );
});
it("should throw an error when category isn't null and doesn't match", () => {
  const result = () =>
    parseTransactionsCSV(chaseCreditCSV, {
      amount: "Amount",
      category: "a",
      date: "Post Date",
      description: "Description",
    });
  expect(result).toThrow(new Error("There were no headers that mapped to: category"));
});
it("should successfully parse CSV files with different mappings", () => {
  const result1 = parseTransactionsCSV(chaseCheckingCSV, MAPPINGS.CHASE_CHECKINGS);
  const result2 = parseTransactionsCSV(chaseCreditCSV, MAPPINGS.CHASE_CREDIT);
  const result3 = parseTransactionsCSV(discoverCSV, MAPPINGS.DISCOVER);

  expect(result1).toBe(`2025-03-20\tPaycheck\t1500\t
2025-03-21\tGrocery Store\t75.5\t
2025-03-22\tGas Station\t40\t
2025-03-23\tFreelance Payment\t500\t
2025-03-24\tOnline Subscription\t12.99\t
2025-03-25\tGift\t200\t
2025-03-26\tDining Out\t55\t
2025-03-27\tElectric Bill\t100\t
2025-03-28\tTax Refund\t800\t
2025-03-29\tCar Maintenance\t250\t`);
  expect(result2).toBe(`2025-03-21\tCoffee Shop\t4.75\tFood & Dining
2025-03-19\tGrocery Store\t52.3\tGroceries
2025-03-18\tSalary Deposit\t2500\tIncome
2025-03-18\tElectric Bill\t120.5\tUtilities
2025-03-17\tGas Station\t45\tTransport
2025-03-15\tOnline Subscription\t12.99\tEntertainment
2025-03-14\tRetail Store\t89.99\tShopping
2025-03-14\tDining Out\t27.4\tFood & Dining
2025-03-12\tInvestment Deposit\t500\tInvestments
2025-03-11\tCar Insurance\t75\tInsurance`);
  expect(result3).toBe(`2025-03-21\tCoffee Shop\t4.75\tFood & Dining
2025-03-19\tGrocery Store\t52.3\tGroceries
2025-03-18\tSalary Deposit\t2500\tIncome
2025-03-18\tElectric Bill\t120.5\tUtilities
2025-03-17\tGas Station\t45\tTransport
2025-03-15\tOnline Subscription\t12.99\tEntertainment
2025-03-14\tRetail Store\t89.99\tShopping
2025-03-14\tDining Out\t27.4\tFood & Dining
2025-03-12\tInvestment Deposit\t500\tInvestments
2025-03-11\tCar Insurance\t75\tInsurance`);
});
