import { prisma } from "@/lib/db";
import type { Employee } from "@/generated/prisma/client";
import {
  type ContractDocumentData,
  type ContractParty,
} from "@/lib/contracts/pdf-data";
import { generateOproepovereenkomstPdf } from "@/lib/pdf/generate-oproepovereenkomst";
import { generateHuishoudelijkReglementPdf } from "@/lib/pdf/generate-huishoudelijk-reglement";
import { uploadPrivatePdf } from "@/lib/contracts/blob";

export function employeeToParty(employee: Employee): ContractParty {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    initials: employee.initials,
    namePrefix: employee.namePrefix,
    dateOfBirth: employee.dateOfBirth,
    street: employee.street,
    houseNumber: employee.houseNumber,
    postalCode: employee.postalCode,
    city: employee.city,
    phone: employee.phone,
    email: employee.email,
    iban: employee.iban,
    bsn: employee.bsn,
    placeOfBirth: employee.placeOfBirth,
    gender: employee.gender,
    nationality: employee.nationality,
    maritalStatus: employee.maritalStatus,
    applyPayrollTaxCredit: employee.applyPayrollTaxCredit,
    receivesBenefits: employee.receivesBenefits,
  };
}

export function toContractDocumentData(opts: {
  employee: Employee;
  startDate: Date;
  endDate: Date;
  hourlyRate: number;
  jobTitle: string;
  employeeSignatureData?: string | null;
  employerSignatureData?: string | null;
  signedOn?: Date | null;
}): ContractDocumentData {
  return {
    employee: employeeToParty(opts.employee),
    startDate: opts.startDate,
    endDate: opts.endDate,
    hourlyRate: opts.hourlyRate,
    jobTitle: opts.jobTitle,
    employeeSignatureData: opts.employeeSignatureData,
    employerSignatureData: opts.employerSignatureData,
    signedOn: opts.signedOn,
  };
}

export async function storeEmployeeSignedPdfs(opts: {
  employee: Employee;
  contractId: string;
  startDate: Date;
  endDate: Date;
  hourlyRate: number;
  jobTitle: string;
  employeeSignatureData: string;
  reglementSignatureData: string;
  signedOn: Date;
}) {
  const data = toContractDocumentData({
    ...opts,
    employerSignatureData: null,
  });
  const reglementData = {
    ...data,
    employeeSignatureData: opts.reglementSignatureData,
  };

  const [contractPdf, reglementPdf] = await Promise.all([
    generateOproepovereenkomstPdf(data),
    generateHuishoudelijkReglementPdf(reglementData),
  ]);

  const [contractBlob, reglementBlob] = await Promise.all([
    uploadPrivatePdf({
      pathname: `contracts/${opts.employee.id}/${opts.contractId}/oproep-employee.pdf`,
      buffer: contractPdf,
    }),
    uploadPrivatePdf({
      pathname: `contracts/${opts.employee.id}/${opts.contractId}/reglement.pdf`,
      buffer: reglementPdf,
    }),
  ]);

  return { contractBlob, reglementBlob };
}

export async function storeFullySignedPdf(opts: {
  employee: Employee;
  contractId: string;
  startDate: Date;
  endDate: Date;
  hourlyRate: number;
  jobTitle: string;
  employeeSignatureData: string;
  employerSignatureData: string;
  signedOn: Date;
}) {
  const pdf = await generateOproepovereenkomstPdf(
    toContractDocumentData(opts),
  );
  return uploadPrivatePdf({
    pathname: `contracts/${opts.employee.id}/${opts.contractId}/oproep-fully-signed.pdf`,
    buffer: pdf,
  });
}

export async function getEmployeeWithShiftCount(employeeId: string) {
  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: { _count: { select: { submissions: true } } },
  });
}
