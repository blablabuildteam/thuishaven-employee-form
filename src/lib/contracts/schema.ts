import { z } from "zod";

export const contractVerifySchema = z.object({
  bsn: z.string().length(9, "BSN moet 9 cijfers zijn"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geboortedatum is verplicht"),
});

export const contractCompleteSchema = z.object({
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
