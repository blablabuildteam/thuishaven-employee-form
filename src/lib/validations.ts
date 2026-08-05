import { z } from "zod";
import { checkIban, validateIban } from "@/lib/iban";

function validateBSN(bsn: string): boolean {
  if (!/^\d{9}$/.test(bsn)) return false;
  const digits = bsn.split("").map(Number);
  const sum =
    9 * digits[0] +
    8 * digits[1] +
    7 * digits[2] +
    6 * digits[3] +
    5 * digits[4] +
    4 * digits[5] +
    3 * digits[6] +
    2 * digits[7] +
    -1 * digits[8];
  return sum % 11 === 0 && sum !== 0;
}

export const formSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  dateOfBirth: z.string().min(1, "Geboortedatum is verplicht"),
  bsn: z
    .string()
    .length(9, "BSN moet 9 cijfers zijn")
    .refine(validateBSN, "Ongeldig BSN (11-proef gefaald)"),
  street: z.string().min(1, "Straat is verplicht"),
  houseNumber: z.string().min(1, "Huisnummer is verplicht"),
  postalCode: z
    .string()
    .regex(/^\d{4}\s?[A-Za-z]{2}$/, "Ongeldig postcode formaat (bijv. 1234 AB)"),
  city: z.string().min(1, "Woonplaats is verplicht"),
  phone: z.string().min(1, "Telefoonnummer is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  iban: z
    .string()
    .min(1, "IBAN is verplicht")
    .superRefine((v, ctx) => {
      if (validateIban(v)) return;
      ctx.addIssue({
        code: "custom",
        message: checkIban(v).message || "Ongeldig IBAN",
      });
    }),
  eventDate: z.string().min(1, "Datum project is verplicht"),
  department: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Gebruik HH:MM formaat"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Gebruik HH:MM formaat"),
  breakMinutes: z.coerce.number().min(0, "Pauze kan niet negatief zijn"),
  signatureData: z.string().min(1, "Handtekening is verplicht"),
  honeypot: z.string().max(0).optional(),
});

export type FormData = z.infer<typeof formSchema>;
