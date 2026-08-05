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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  subheader: {
    fontSize: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 180,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    flex: 1,
  },
  section: {
    marginTop: 12,
    marginBottom: 12,
  },
  rateSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  rateRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 180,
  },
  totalRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 12,
  },
  signatureSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginLeft: 180,
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 12,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  disclaimerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginTop: 8,
    marginBottom: 2,
  },
  warning: {
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  note: {
    marginTop: 4,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#8B0000",
  },
  taxFollowUp: {
    marginTop: 4,
    fontSize: 8.5,
    lineHeight: 1.4,
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

function IB47Document({ employee, submission }: IB47Data) {
  const eventDate =
    submission.eventDate instanceof Date
      ? submission.eventDate
      : new Date(submission.eventDate);
  const dob =
    employee.dateOfBirth instanceof Date
      ? employee.dateOfBirth
      : new Date(employee.dateOfBirth);

  const is18_19 = submission.hourlyRate < 14.75;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>THUISHAVEN</Text>
        <Text style={styles.subheader}>IB47-formulier</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Datum dienst:</Text>
            <Text style={styles.value}>
              {format(eventDate, "dd-MM-yyyy")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Afdeling:</Text>
            <Text style={styles.value}>{submission.department || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Voornaam + achternaam:</Text>
            <Text style={styles.value}>
              {employee.firstName} {employee.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Geboortedatum:</Text>
            <Text style={styles.value}>{format(dob, "dd-MM-yyyy")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>BSN/Sofinummer:</Text>
            <Text style={styles.value}>{employee.bsn}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Straat + huisnummer:</Text>
            <Text style={styles.value}>
              {employee.street} {employee.houseNumber}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Postcode + woonplaats:</Text>
            <Text style={styles.value}>
              {employee.postalCode} {employee.city}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefoonnummer:</Text>
            <Text style={styles.value}>{employee.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{employee.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bankrekeningnummer:</Text>
            <Text style={styles.value}>{employee.iban}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Starttijd:</Text>
            <Text style={styles.value}>{submission.startTime}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Eindtijd:</Text>
            <Text style={styles.value}>{submission.endTime}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pauze:</Text>
            <Text style={styles.value}>{submission.breakMinutes} min</Text>
          </View>
        </View>

        <View style={styles.rateSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Uurloon:</Text>
            <Text style={styles.value}>
              {is18_19 ? "☑" : "☐"} 18/19 jaar = €13,25 per uur
            </Text>
          </View>
          <View style={styles.rateRow}>
            <Text>
              {!is18_19 ? "☑" : "☐"} ≥ 20 jaar = €14,75 per uur
            </Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.label}>Totaal:</Text>
          <Text style={styles.value}>
            €{submission.hourlyRate.toFixed(2).replace(".", ",")} x{" "}
            {submission.totalHours.toFixed(2).replace(".", ",")} uur = €
            {submission.totalPay.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Handtekening:</Text>
          </View>
          {submission.signatureData && (
            <Image src={submission.signatureData} style={styles.signatureImage} />
          )}
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
