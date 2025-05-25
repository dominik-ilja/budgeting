import { purchaseProfileSchema } from "./validation";

describe("Purchase Profile Schema", () => {
  test.each([
    [{}],
    [{ userId: "1" }],
    [{ userId: 1, importProfileId: "1" }],
    [
      {
        userId: 1,
        targetTableId: 1,
        name: "Chase Checkings",
        mappings: [
          { column: "Amount", target: "badTarget", type: "number" },
          { column: "Category", target: "category", type: "bad type" },
          { column: "Posting date", target: "date", type: "date" },
          { column: "Description", target: "description", type: "string" },
        ],
      },
    ],
  ])("Fails invalid values: %s", (data) => {
    const result = purchaseProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
  test.each([
    [
      {
        userId: 1,
        targetTableId: 1,
        name: "Chase Checkings",
        mappings: [
          { column: "Amount", target: "amount", type: "number" },
          { column: "Category", target: "category", type: "string" },
          { column: "Posting date", target: "date", type: "date" },
          { column: "Description", target: "description", type: "string" },
        ],
      },
    ],
    [
      {
        userId: 1,
        targetTableId: 1,
        name: "Chase Checkings",
        mappings: [
          { column: "Amount", target: "amount", type: "number" },
          { column: "Posting date", target: "date", type: "date" },
          { column: "Description", target: "description", type: "string" },
        ],
      },
    ],
  ])("Passes valid values: %s", (data) => {
    const result = purchaseProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});
