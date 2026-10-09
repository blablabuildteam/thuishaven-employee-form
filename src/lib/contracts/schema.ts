import { z } from "zod";
import { formatDutchPostalCode } from "@/lib/address";
import { formSchema } from "@/lib/validations";

export const contractVerifySchema = z.object({
  bsn: z.string().length(9, "BSN moet 9 cijfers zijn"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geboortedatum is verplicht"),
});

/** Address and contact details the employee may correct before signing. */
export const contractContactSchema = z.object({
  street: z.string().trim().min(1, "Straat is verplicht"),
  houseNumber: z.string().trim().min(1, "Huisnummer is verplicht"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}\s?[A-Za-z]{2}$/, "Ongeldig postcode formaat (bijv. 1234 AB)")
    .transform((value) => formatDutchPostalCode(value)),
  city: z.string().trim().min(1, "Woonplaats is verplicht"),
  phone: z.string().trim().min(1, "Telefoonnummer is verplicht"),
  email: z.string().trim().email("Ongeldig e-mailadres"),
  iban: z.string().trim().pipe(formSchema.shape.iban),
});

export const contractCompleteSchema = contractContactSchema.extend({
  initials: z.string().min(1, "Voorletter is verplicht"),
  namePrefix: z.string().optional().default(""),
  placeOfBirth: z.string().min(1, "Geboorteplaats is verplicht"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  nationality: z.string().min(1, "Nationaliteit is verplicht"),
  maritalStatus: z.enum(["MARRIED", "UNMARRIED"]),
  applyPayrollTaxCredit: z.boolean(),
  receivesBenefits: z.boolean(),
  contractSignatureData: z.string().min(1, "Handtekening op het contract is verplicht"),
  reglementSignatureData: z.string().min(1, "Handtekening op het reglement is verplicht"),
});
