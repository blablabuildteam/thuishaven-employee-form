export type SubmissionDetailEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bsn: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  iban: string;
};

export type SubmissionDetailData = {
  id: string;
  eventDate: string;
  department: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  signatureData: string | null;
  createdAt: string;
  editedAt: string | null;
  editedBy: string | null;
};

export type SubmissionDetailResponse = {
  employee: SubmissionDetailEmployee;
  submission: SubmissionDetailData;
};

export const submissionDetailSelect = {
  id: true,
  eventDate: true,
  department: true,
  startTime: true,
  endTime: true,
  breakMinutes: true,
  hourlyRate: true,
  totalHours: true,
  totalPay: true,
  signatureData: true,
  createdAt: true,
  editedAt: true,
  editedBy: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      bsn: true,
      street: true,
      houseNumber: true,
      postalCode: true,
      city: true,
      email: true,
      phone: true,
      iban: true,
    },
  },
} as const;

type SubmissionDetailRow = {
  id: string;
  eventDate: Date;
  department: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: { toString(): string } | number;
  totalHours: { toString(): string } | number;
  totalPay: { toString(): string } | number;
  signatureData: string | null;
  createdAt: Date;
  editedAt: Date | null;
  editedBy: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    bsn: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    email: string;
    phone: string;
    iban: string;
  };
};

export function serializeSubmissionDetail(
  row: SubmissionDetailRow,
): SubmissionDetailResponse {
  return {
    employee: {
      id: row.employee.id,
      firstName: row.employee.firstName,
      lastName: row.employee.lastName,
      dateOfBirth: row.employee.dateOfBirth.toISOString(),
      bsn: row.employee.bsn,
      street: row.employee.street,
      houseNumber: row.employee.houseNumber,
      postalCode: row.employee.postalCode,
      city: row.employee.city,
      email: row.employee.email,
      phone: row.employee.phone,
      iban: row.employee.iban,
    },
    submission: {
      id: row.id,
      eventDate: row.eventDate.toISOString(),
      department: row.department,
      startTime: row.startTime,
      endTime: row.endTime,
      breakMinutes: row.breakMinutes,
      hourlyRate: Number(row.hourlyRate),
      totalHours: Number(row.totalHours),
      totalPay: Number(row.totalPay),
      signatureData: row.signatureData,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt?.toISOString() ?? null,
      editedBy: row.editedBy,
    },
  };
}
