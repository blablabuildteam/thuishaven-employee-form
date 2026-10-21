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
 * Express reads a rectangle trained on a sample page. On the paper IB47 that
 * rectangle sits on the handwriting to the right of one label. Side-by-side
 * boxes put several values in that band, so a zone catches a border and a
 * neighbour. Only a date pattern and the amount next to "Totaal" still
 * survive that. Every payroll value is therefore its own row: a fixed label
 * column, then one box of the same size, with the text inset from the border.
 * Row height never depends on the value, so the boxes stay put.
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.2,
  },
  header: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  subheader: {
    fontSize: 11,
    marginBottom: 4,
  },
  anchor: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 18,
    marginBottom: 3,
  },
  fieldLabel: {
    width: 108,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginRight: 8,
  },
  valueBox: {
    flex: 1,
    height: 16,
    borderWidth: 0.75,
    borderColor: "#000",
    paddingHorizontal: 6,
    justifyContent: "center",
    overflow: "hidden",
  },
  valueText: {
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1,
  },
  groupGap: {
    height: 5,
  },
  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    marginBottom: 4,
  },
  signatureBox: {
    flex: 1,
    height: 44,
    borderWidth: 0.75,
    borderColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  signatureImage: {
    width: 160,
    height: 38,
    objectFit: "contain",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginTop: 2,
    marginBottom: 6,
  },
  disclaimer: {
    fontSize: 7.5,
    lineHeight: 1.3,
  },
  disclaimerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginTop: 4,
    marginBottom: 1,
  },
  warning: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  taxFollowUp: {
    marginTop: 2,
    fontSize: 7.5,
    lineHeight: 1.3,
  },
  note: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#8B0000",
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow} wrap={false}>
      <Text style={styles.fieldLabel} wrap={false}>
        {label}
      </Text>
      <View style={styles.valueBox}>
        <Text style={styles.valueText} wrap={false}>
          {value || " "}
        </Text>
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
      <Page size="A4" style={styles.page} wrap={false}>
        <Text style={styles.header}>THUISHAVEN</Text>
        <Text style={styles.subheader}>IB47-formulier</Text>
        <View style={styles.anchor} />

        <Field label="Datum dienst" value={format(eventDate, "dd-MM-yyyy")} />
        <Field label="Afdeling" value={submission.department?.trim() ?? ""} />

        <View style={styles.groupGap} />

        <Field label="Voornaam" value={employee.firstName.trim()} />
        <Field label="Tussenvoegsel" value={employee.namePrefix?.trim() ?? ""} />
        <Field label="Achternaam" value={employee.lastName.trim()} />
        <Field label="Mobiele nummer" value={employee.phone.trim()} />
        <Field label="E-mail" value={employee.email.trim()} />
        <Field label="Geslacht" value={genderLabel(employee.gender)} />
        <Field label="Geboortedatum" value={format(dob, "dd-MM-yyyy")} />
        <Field label="BSN-nummer" value={employee.bsn.trim()} />
        <Field label="Straat" value={employee.street.trim()} />
        <Field label="Huisnummer" value={employee.houseNumber.trim()} />
        <Field label="Postcode" value={employee.postalCode.trim()} />
        <Field label="Woonplaats" value={employee.city.trim()} />
        <Field label="IBAN" value={normalizeIban(employee.iban)} />

        <View style={styles.groupGap} />

        <Field label="Starttijd" value={submission.startTime} />
        <Field label="Eindtijd" value={submission.endTime} />
        <Field label="Pauze (min)" value={String(submission.breakMinutes)} />

        <View style={styles.groupGap} />

        <Field label="Leeftijd" value={ageCategory} />
        <Field label="Uurloon" value={formatCurrency(submission.hourlyRate)} />
        <Field label="Uren" value={formatHours(submission.totalHours)} />
        <Field label="Totaal" value={formatCurrency(submission.totalPay)} />

        <View style={styles.groupGap} />

        <View style={styles.signatureRow} wrap={false}>
          <Text style={styles.fieldLabel} wrap={false}>
            Handtekening
          </Text>
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
