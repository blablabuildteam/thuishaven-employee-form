import { z } from "zod";

export const payRateInputSchema = z.object({
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Gebruik JJJJ-MM-DD"),
  under20Rate: z.coerce
    .number()
    .positive("Uurloon onder 20 moet groter dan 0 zijn"),
  over20Rate: z.coerce
    .number()
    .positive("Uurloon 20+ moet groter dan 0 zijn"),
});
