import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { DISCLAIMER } from "@/lib/disclaimer";
import { formatCurrency } from "@/lib/format";
import { genderLabel } from "@/lib/contracts/pdf-data";
import { normalizeIban } from "@/lib/iban";
import { getAgeCategory } from "@/lib/pay-calculation";
import type { Gender } from "@/generated/prisma/client";

/**
 * Each value sits alone in a fixed-height box. Express (and similar zonal
 * scanners) copy whatever falls inside a rectangle trained on a sample page,
 * and those rectangles only survive if every PDF has the same boxes in the
 * same place. Labels stay outside the boxes. Combined lines (full name,
 * full address, a pay equation) are split so one box is one payroll field.
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.3,
  },
  header: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  subheader: {
    fontSize: 11,
    marginBottom: 6,
  },
  anchor: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    marginBottom: 8,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 5,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  valueBox: {
    height: 18,
    borderWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 4,
    paddingTop: 3,
    justifyContent: "center",
    overflow: "hidden",
  },
  valueText: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  signatureBox: {
    height: 52,
    borderWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: "center",
  },
  signatureImage: {
    width: 180,
    height: 46,
    objectFit: "contain",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginTop: 4,
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 8,
    lineHeight: 1.35,
  },
  disclaimerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    marginTop: 6,
    marginBottom: 1,
  },
  warning: {
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  note: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8B0000",
  },
  taxFollowUp: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 1.35,
  },
});

interface IB47Data {
  employee: {
    firstName: string;
    lastName: string;
    namePrefix?: string | null;
    dateOfBirth: string | Date;
    bsn: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
    gender?: Gender | null;
    iban: string;
  };
  submission: {
    eventDate: string | Date;
    department?: string | null;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    hourlyRate: number;
    totalHours: number;
    totalPay: number;
    signatureData?: string | null;
    createdAt?: string | Date;
  };
}

function Field({
  label,
  value,
  flex = 1,
}: {
  label: string;
  value: string;
  flex?: number;
}) {
  return (
    <View style={{ flex }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{value || " "}</Text>
      </View>
    </View>
  );
}

function formatHours(hours: number): string {
  return hours.toFixed(2).replace(".", ",");
}

function IB47Document({ employee, submission }: IB47Data) {
  const eventDate =
    submission.eventDate instanceof Date
      ? submission.eventDate
      : new Date(submission.eventDate);
  const dob =
    employee.dateOfBirth instanceof Date
      ? employee.dateOfBirth
      : new Date(employee.dateOfBirth);

  const ageCategory = getAgeCategory(dob, eventDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>THUISHAVEN</Text>
        <Text style={styles.subheader}>IB47-formulier</Text>
        <View style={styles.anchor} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persoonsgegevens</Text>
          <View style={styles.fieldRow}>
            <Field label="Voornaam" value={employee.firstName.trim()} flex={2} />
            <Field
              label="Tussenvoegsel"
              value={employee.namePrefix?.trim() ?? ""}
              flex={1.4}
            />
            <Field label="Achternaam" value={employee.lastName.trim()} flex={2} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="Geboortedatum" value={format(dob, "dd-MM-yyyy")} />
            <Field label="Geslacht" value={genderLabel(employee.gender)} />
            <Field label="BSN" value={employee.bsn.trim()} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="Telefoon" value={employee.phone.trim()} />
            <Field label="E-mail" value={employee.email.trim()} flex={2} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="Straat" value={employee.street.trim()} flex={3} />
            <Field label="Huisnummer" value={employee.houseNumber.trim()} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="Postcode" value={employee.postalCode.trim()} />
            <Field label="Woonplaats" value={employee.city.trim()} flex={2} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="IBAN" value={normalizeIban(employee.iban)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dienst</Text>
          <View style={styles.fieldRow}>
            <Field label="Datum dienst" value={format(eventDate, "dd-MM-yyyy")} />
            <Field label="Afdeling" value={submission.department?.trim() ?? ""} flex={2} />
          </View>
          <View style={styles.fieldRow}>
            <Field label="Starttijd" value={submission.startTime} />
            <Field label="Eindtijd" value={submission.endTime} />
            <Field label="Pauze (min)" value={String(submission.breakMinutes)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verloning</Text>
          <View style={styles.fieldRow}>
            <Field label="Leeftijd" value={ageCategory} />
            <Field label="Uurloon" value={formatCurrency(submission.hourlyRate)} />
            <Field label="Uren" value={formatHours(submission.totalHours)} />
            <Field label="Totaal" value={formatCurrency(submission.totalPay)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handtekening</Text>
          <View style={styles.signatureBox}>
            {submission.signatureData ? (
              <Image src={submission.signatureData} style={styles.signatureImage} />
            ) : (
              <Text> </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>{DISCLAIMER.liabilityTitle}</Text>
          <Text>{DISCLAIMER.liability}</Text>

          <Text style={styles.disclaimerTitle}>{DISCLAIMER.taxTitle}</Text>
          <Text>{DISCLAIMER.tax}</Text>

          <Text style={styles.warning}>{DISCLAIMER.noPayslip}</Text>
          <Text style={styles.taxFollowUp}>
            {DISCLAIMER.taxNote}{" "}
            <Text style={styles.note}>{DISCLAIMER.idNote}</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateIB47PDF(data: IB47Data): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <IB47Document employee={data.employee} submission={data.submission} />,
  );
  return Buffer.from(buffer);
}
