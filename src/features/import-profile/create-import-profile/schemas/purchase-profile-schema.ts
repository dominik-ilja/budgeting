import { z } from "zod";

const expectedTargetToTypeMapping = {
  amount: "number",
  category: "string",
  date: "date",
  description: "string",
} as const;

// This is used to validate that the target columns have the correct data type associated with them
// This also ensures that only the correct mappings are being added for the purchase table.
const purchaseMappingSchema = z
  .object({
    column: z.string(),
    target: z.enum(["amount", "category", "date", "description"]),
    type: z.enum(["date", "number", "string"]),
  })
  .superRefine((mapping, ctx) => {
    const expectedType = expectedTargetToTypeMapping[mapping.target];
    if (mapping.type !== expectedType) {
      ctx.addIssue({
        path: ["type"],
        code: z.ZodIssueCode.custom,
        message: `Expected type "${expectedType}" for target "${mapping.target}"`,
      });
    }
  });

export const purchaseProfileSchema = z.object({
  userId: z.number(),
  targetTableId: z.number(),
  name: z.string().nonempty(),
  mappings: z
    .array(purchaseMappingSchema)
    .refine(
      (mappings) => {
        const seen = new Set(mappings.map((m) => m.target));
        return seen.has("amount") && seen.has("date") && seen.has("description");
      },
      {
        message:
          "Mappings must include amount, description, and date. 'Category' is optional. No duplicate targets allowed.",
      }
    )
    .refine(
      (mappings) => {
        const targets = mappings.map((m) => m.target);
        return new Set(targets).size === targets.length;
      },
      { message: "Duplicate mapping targets are not allowed." }
    ),
});
