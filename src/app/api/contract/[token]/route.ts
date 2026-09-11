import { NextResponse } from "next/server";
import { requireVerifiedContract } from "@/lib/contracts/session";
import { formatIsoDate } from "@/lib/contracts/dates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await requireVerifiedContract(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { contract } = result;
  if (contract.status !== "INVITED") {
    return NextResponse.json(
      { error: "Dit contract is al ondertekend.", alreadySigned: true },
      { status: 409 },
    );
  }

  const { employee } = contract;
  return NextResponse.json({
    contract: {
      startDate: formatIsoDate(contract.startDate),
      endDate: formatIsoDate(contract.endDate),
      hourlyRate: Number(contract.hourlyRate),
    },
    employee: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      dateOfBirth: formatIsoDate(employee.dateOfBirth),
      street: employee.street,
      houseNumber: employee.houseNumber,
      postalCode: employee.postalCode,
      city: employee.city,
      phone: employee.phone,
      email: employee.email,
      iban: employee.iban,
      bsn: employee.bsn,
      initials: employee.initials ?? "",
      namePrefix: employee.namePrefix ?? "",
      placeOfBirth: employee.placeOfBirth ?? "",
      gender: employee.gender,
      nationality: employee.nationality ?? "",
      maritalStatus: employee.maritalStatus,
      applyPayrollTaxCredit: employee.applyPayrollTaxCredit,
      receivesBenefits: employee.receivesBenefits,
    },
  });
}
