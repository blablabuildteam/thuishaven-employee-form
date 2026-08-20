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
import { getAgeCategory, RATE_18_19, RATE_20_PLUS } from "@/lib/pay-calculation";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 36,
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
    marginBottom: 10,
  },
  section: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  label: {
    width: 160,
    fontFamily: "Helvetica-Bold",
    paddingTop: 1,
  },
  value: {
    flex: 1,
  },
  checkList: {
    flex: 1,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
    marginTop: 0.5,
  },
  signatureSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  signatureImage: {
    width: 180,
    height: 52,
    marginLeft: 160,
    marginTop: 2,
    objectFit: "contain",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
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
    dateOfBirth: string | Date;
    bsn: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
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

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function PdfCheckbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkbox}>
      {checked ? <Text style={styles.checkboxMark}>X</Text> : null}
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

  const is18_19 = getAgeCategory(dob, eventDate) === "18/19";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>THUISHAVEN</Text>
        <Text style={styles.subheader}>IB47-formulier</Text>

        <View style={styles.section}>
          <FieldRow label="Datum dienst:" value={format(eventDate, "dd-MM-yyyy")} />
          <FieldRow label="Afdeling:" value={submission.department || "-"} />
          <FieldRow
            label="Voornaam + achternaam:"
            value={`${employee.firstName} ${employee.lastName}`}
          />
        </View>

        <View style={styles.section}>
          <FieldRow label="Geboortedatum:" value={format(dob, "dd-MM-yyyy")} />
          <FieldRow label="BSN/Sofinummer:" value={employee.bsn} />
          <FieldRow
            label="Straat + huisnummer:"
            value={`${employee.street} ${employee.houseNumber}`}
          />
          <FieldRow
            label="Postcode + woonplaats:"
            value={`${employee.postalCode} ${employee.city}`}
          />
          <FieldRow label="Telefoonnummer:" value={employee.phone} />
          <FieldRow label="Email:" value={employee.email} />
          <FieldRow label="Bankrekeningnummer:" value={employee.iban} />
        </View>

        <View style={styles.section}>
          <FieldRow label="Starttijd:" value={submission.startTime} />
          <FieldRow label="Eindtijd:" value={submission.endTime} />
          <FieldRow label="Pauze:" value={`${submission.breakMinutes} min`} />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Uurloon:</Text>
            <View style={styles.checkList}>
              <View style={styles.checkRow}>
                <PdfCheckbox checked={is18_19} />
                <Text>
                  18/19 jaar = {formatCurrency(RATE_18_19)} per uur
                </Text>
              </View>
              <View style={styles.checkRow}>
                <PdfCheckbox checked={!is18_19} />
                <Text>
                  20 jaar of ouder = {formatCurrency(RATE_20_PLUS)} per uur
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Totaal:</Text>
            <Text style={styles.value}>
              {formatCurrency(submission.hourlyRate)} x {formatHours(submission.totalHours)} uur = {formatCurrency(submission.totalPay)}
            </Text>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Handtekening:</Text>
          </View>
          {submission.signatureData ? (
            <Image src={submission.signatureData} style={styles.signatureImage} />
          ) : null}
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
