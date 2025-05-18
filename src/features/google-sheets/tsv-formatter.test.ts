import { formatRowsAsTsv } from "./tsv-formatter";

describe("formatRowsAsTsv", () => {
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
    const expected = `-4.75\tFood & Dining\t2025-03-20\tCoffee Shop
-52.30\tGroceries\t2025-03-19\tGrocery Store
-2500.00\tIncome\t2025-03-18\tSalary Deposit
-120.50\tUtilities\t2025-03-17\tElectric Bill
-45.00\tTransport\t2025-03-16\tGas Station
-12.99\tEntertainment\t2025-03-15\tOnline Subscription
-89.99\tShopping\t2025-03-14\tRetail Store
-27.40\tFood & Dining\t2025-03-13\tDining Out
-500.00\tInvestments\t2025-03-12\tInvestment Deposit
-75.00\tInsurance\t2025-03-11\tCar Insurance`;

    const actual = formatRowsAsTsv(rows);

    expect(actual).toBe(expected);
  });
  describe("Sorts the columns by the ordering", () => {
    test.each([
      {
        test: "All keys are in row",
        rows: [
          {
            amount: "-4.75",
            category: "Food & Dining",
            date: "2025-03-20",
            description: "Coffee Shop",
          },
        ],
        order: { date: 1, amount: 2, description: 3, category: 4 },
        expected: `2025-03-20\t-4.75\tCoffee Shop\tFood & Dining`,
      },
      {
        test: "All keys are not in row",
        rows: [
          {
            amount: "-4.75",
            category: "Food & Dining",
            date: "2025-03-20",
            description: "Coffee Shop",
          },
        ],
        order: { description: 3, category: 4 },
        expected: `Coffee Shop\tFood & Dining\t-4.75\t2025-03-20`,
      },
    ])("$test", ({ expected, order, rows }) => {
      const actual = formatRowsAsTsv(rows, order);

      expect(actual).toBe(expected);
    });
  });
});
