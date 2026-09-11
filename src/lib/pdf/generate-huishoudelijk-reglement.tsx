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
import { PdfBrandHeader } from "@/lib/pdf/brand-header";
import { HUISHOUDELIJK_REGLEMENT } from "@/lib/contracts/copy";
import {
  type ContractDocumentData,
  fullName,
} from "@/lib/contracts/pdf-data";

const styles = StyleSheet.create({
  page: {
    paddingTop: 112,
    paddingBottom: 28,
    paddingHorizontal: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    lineHeight: 1.32,
    color: "#111",
  },
  body: {
    paddingHorizontal: 36,
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 7,
    marginBottom: 3,
    color: "#2D6A4F",
  },
  paragraph: {
    marginBottom: 3,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 2,
  },
  signatureImage: {
    width: 180,
    height: 50,
    objectFit: "contain",
    marginTop: 6,
  },
});

function ReglementDocument({ data }: { data: ContractDocumentData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader subtitle="Huishoudelijk reglement" />
        <View style={styles.body}>
        <Text style={styles.title}>{HUISHOUDELIJK_REGLEMENT.title}</Text>
        {HUISHOUDELIJK_REGLEMENT.sections.map((section) => (
          <View key={section.heading}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph.slice(0, 40)} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {"bullets" in section && section.bullets
              ? section.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))
              : null}
          </View>
        ))}
        <View style={{ marginTop: 14 }}>
          <Text>Ondertekend door {fullName(data.employee)}</Text>
          {data.employeeSignatureData ? (
            <Image
              src={data.employeeSignatureData}
              style={styles.signatureImage}
            />
          ) : null}
        </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateHuishoudelijkReglementPdf(
  data: ContractDocumentData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReglementDocument data={data} />);
  return Buffer.from(buffer);
}
