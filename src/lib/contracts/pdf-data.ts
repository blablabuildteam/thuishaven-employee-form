import type { Gender, MaritalStatus } from "@/generated/prisma/client";
import { formatDate } from "@/lib/format";

export function genderLabel(gender: Gender | null | undefined): string {
  switch (gender) {
    case "MALE":
      return "Man";
    case "FEMALE":
      return "Vrouw";
    case "OTHER":
      return "Anders";
    default:
      return "";
  }
}

export function maritalLabel(
  status: MaritalStatus | null | undefined,
): string {
  switch (status) {
    case "MARRIED":
      return "Gehuwd";
    case "UNMARRIED":
      return "Ongehuwd";
    default:
      return "";
  }
}

export function yesNo(value: boolean | null | undefined): string {
  if (value == null) return "";
  return value ? "Ja" : "Nee";
}

export type ContractParty = {
  firstName: string;
  lastName: string;
  initials: string | null;
  namePrefix: string | null;
  dateOfBirth: Date | string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  iban: string;
  bsn: string;
  placeOfBirth: string | null;
  gender: Gender | null;
  nationality: string | null;
  maritalStatus: MaritalStatus | null;
  applyPayrollTaxCredit: boolean | null;
  receivesBenefits: boolean | null;
};

export type ContractDocumentData = {
  employee: ContractParty;
  startDate: Date | string;
  endDate: Date | string;
  hourlyRate: number;
  jobTitle: string;
  employeeSignatureData?: string | null;
  employerSignatureData?: string | null;
  signedOn?: Date | string | null;
};

export function fullName(employee: ContractParty): string {
  const prefix = employee.namePrefix?.trim();
  return [employee.firstName, prefix, employee.lastName]
    .filter(Boolean)
    .join(" ");
}

export function fullAddress(employee: ContractParty): string {
  return `${employee.street} ${employee.houseNumber}, ${employee.postalCode} ${employee.city}`;
}

export function formatContractDate(value: Date | string): string {
  return formatDate(value);
}
