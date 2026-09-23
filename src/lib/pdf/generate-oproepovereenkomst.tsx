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
import { EMPLOYER } from "@/lib/contracts/copy";
import {
  type ContractDocumentData,
  formatContractDate,
  fullAddress,
  fullName,
  genderLabel,
  maritalLabel,
  yesNo,
} from "@/lib/contracts/pdf-data";
import { formatCurrency } from "@/lib/format";
import { isValidSignatureDataUrl } from "@/lib/signatures/validate";

const styles = StyleSheet.create({
  page: {
    paddingTop: 112,
    paddingBottom: 28,
    paddingHorizontal: 0,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
    color: "#111",
  },
  body: {
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#2D6A4F",
  },
  paragraph: {
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 3,
  },
  tableLabel: {
    width: "42%",
    fontFamily: "Helvetica-Bold",
  },
  tableValue: {
    width: "58%",
  },
  signatures: {
    flexDirection: "row",
    marginTop: 18,
    gap: 24,
  },
  signatureCol: {
    flex: 1,
  },
  signatureBox: {
    height: 56,
    marginTop: 6,
    marginBottom: 4,
  },
  signatureImage: {
    width: 160,
    height: 52,
    objectFit: "contain",
  },
  muted: {
    fontSize: 8,
    color: "#444",
  },
});

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value || "—"}</Text>
    </View>
  );
}

function OproepDocument({ data }: { data: ContractDocumentData }) {
  const start = formatContractDate(data.startDate);
  const end = formatContractDate(data.endDate);
  const wage = formatCurrency(data.hourlyRate);
  const jobTitle = data.jobTitle;
  // Job title with lowercase first letter for use in sentences
  const jobTitleLower = jobTitle.charAt(0).toLowerCase() + jobTitle.slice(1);
  const name = fullName(data.employee);
  const address = fullAddress(data.employee);
  const dob = formatContractDate(data.employee.dateOfBirth);
  const signedOn = data.signedOn
    ? formatContractDate(data.signedOn)
    : start;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader subtitle="Oproepovereenkomst" />
        <View style={styles.body}>
        <Text style={styles.title}>Oproepovereenkomst voor bepaalde tijd</Text>
        <P>De ondergetekenden</P>
        <P>
          {EMPLOYER.company} gevestigd te {EMPLOYER.address}, ingeschreven bij
          de Kamer van Koophandel onder nummer {EMPLOYER.kvk}.
        </P>
        <P>Hierna te noemen “werkgever”</P>
        <P>en</P>
        <P>Naam: {name}</P>
        <P>Geb. datum: {dob}</P>
        <P>Adres: {address}</P>
        <P>Hierna te noemen “oproepkracht”</P>
        <P>Verklaren te zijn overeengekomen als volgt</P>

        <Text style={styles.heading}>Artikel 1. Indiensttreding</Text>
        <P>
          De werknemer treedt met ingang van {start} voor twaalf maanden in
          dienst van de werkgever als oproepkracht voor het verrichten van
          werkzaamheden als {jobTitleLower}. Er is geen vast aantal uren
          overeengekomen. De arbeidsovereenkomst eindigt van rechtswege op {end}.
          Op de arbeidsovereenkomst is geen collectieve arbeidsovereenkomst van
          toepassing.
        </P>

        <Text style={styles.heading}>Artikel 2. Proeftijd</Text>
        <P>De wederzijdse proeftijd bedraagt één maand.</P>

        <Text style={styles.heading}>Artikel 3. Oproeping</Text>
        <P>
          Uitsluitend de werkgever bepaalt of er werkzaamheden zijn die
          rechtvaardigen dat de oproepkracht wordt opgeroepen. Werkgever zorgt
          ervoor dat de oproep steeds tijdig geschiedt. De tijdstippen waarop de
          werkzaamheden worden verricht kunnen variëren en worden overlegd met
          de oproepkracht. De oproepkracht zal, indien opgeroepen en
          beschikbaar, bij de werkgever werkzaamheden verrichten in de functie
          van {jobTitle}. De werkzaamheden vinden plaats te Amsterdam.
          De oproepkracht dient tenminste 15 minuten voor aanvang dienst
          aanwezig te zijn. De oproepkracht heeft alleen recht op loon indien
          hij daadwerkelijk als oproepkracht door de werkgever is opgeroepen en
          deze oproep heeft geaccepteerd.
        </P>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PdfBrandHeader subtitle="Oproepovereenkomst" />
        <View style={styles.body}>
        <Text style={styles.heading}>Artikel 4. Loon</Text>
        <P>
          Het loon is exclusief 8% vakantiegeld, vakantierechten en overige
          reserveringen. Alle reserveringen voor opbouw vakantiegeld,
          vakantierechten en overige reserveringen zijn niet opgenomen in het
          bruto uurloon. Alle reserveringen als hierboven genoemd worden niet
          gereserveerd en uitbetaald samen met het loon op de vijftiende van de
          daaropvolgende maand. Iedere maand wordt er een loonstrook verstrekt
          in je eigen XPS-logic account.
        </P>
        <P>Het loon bedraagt {wage} bruto per uur.</P>
        <P>
          Gedurende de eerste zes maanden heeft de oproepkracht ingevolge
          artikel 7:628 lid 5 BW alleen recht op loon wanneer hij daadwerkelijk
          heeft gewerkt.
        </P>

        <Text style={styles.heading}>Artikel 5. Arbeidsongeschiktheid</Text>
        <P>
          De werkgever is bevoegd bij iedere ziekmelding twee wachtdagen toe te
          passen. Dit houdt in dat over de eerste twee dagen van de
          arbeidsongeschiktheid geen loon wordt betaald. De perioden waarin de
          oproepkracht in verband met ongeschiktheid ten gevolge van ziekte,
          zwangerschap of bevalling verhinderd is geweest arbeid te verrichten,
          worden samengeteld indien zij elkaar met een onderbreking van minder
          dan vier weken opvolgen, tenzij de ongeschiktheid redelijkerwijs niet
          geacht kan worden voort te vloeien uit dezelfde oorzaak. In geval van
          arbeidsongeschiktheid zal werkgever, met uitzondering van de
          wachtdagen, 70% van het loon en in ieder geval het wettelijk geldende
          minimumloon doorbetalen tot en met de laatste dag waarop de
          oproepkracht zou hebben gewerkt als hij niet ziek was geweest of
          geworden. Bij ziekte dient men tenminste twee uur voor de dienst
          telefonisch contact op te nemen met de desbetreffende leidinggevende.
        </P>

        <Text style={styles.heading}>Artikel 6. Pensioen</Text>
        <P>Er wordt geen pensioenregeling aangeboden.</P>

        <Text style={styles.heading}>Artikel 7. Vakantie en rooster</Text>
        <P>Per daadwerkelijk gewerkt uur bouwt de oproepkracht 0,052 uur op.</P>

        <Text style={styles.heading}>Artikel 8. Geheimhoudingsplicht</Text>
        <P>
          Oproepkracht is ook na het einde van de overeenkomst verplicht tot
          geheimhouding van al hetgeen hij bij de uitoefening van zijn
          werkzaamheden met betrekking tot de zaken en belangen van de werkgever
          te weten is gekomen. Het niet nakomen van deze geheimhoudingsplicht
          maakt de oproepkracht schadeplichtig.
        </P>

        <Text style={styles.heading}>Artikel 9. Opzegging</Text>
        <P>
          Werkgever en werknemer kunnen de arbeidsovereenkomst tussentijds
          opzeggen met inachtneming van de wettelijke opzegtermijn. De opzegging
          gebeurt tegen het einde van de maand. Oproepkracht verklaart zich
          bekend te zijn met artikel 7:677 BW           “Opzegging wegens dringende
          reden”.
        </P>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PdfBrandHeader subtitle="Oproepovereenkomst" />
        <View style={styles.body}>
        <Text style={styles.heading}>Werkgever {EMPLOYER.company}</Text>
        <Text style={styles.heading}>Persoonlijke gegevens</Text>
        <Row label="Voornaam + achternaam" value={name} />
        <Row label="Mobiele nummer" value={data.employee.phone} />
        <Row label="E-mail" value={data.employee.email} />
        <Row label="Geslacht" value={genderLabel(data.employee.gender)} />
        <Row label="Geboortedatum" value={dob} />
        <Row label="BSN-nummer" value={data.employee.bsn} />
        <Row label="Adres" value={address} />
        <Row label="IBAN" value={data.employee.iban} />
        <Row label="Voorletter" value={data.employee.initials ?? ""} />
        <Row label="Tussenvoegsel" value={data.employee.namePrefix ?? ""} />
        <Row label="Geboorteplaats" value={data.employee.placeOfBirth ?? ""} />
        <Row label="Nationaliteit" value={data.employee.nationality ?? ""} />
        <Row
          label="Burgerlijke staat"
          value={maritalLabel(data.employee.maritalStatus)}
        />
        <Row
          label="Loonheffingskorting toepassen"
          value={yesNo(data.employee.applyPayrollTaxCredit)}
        />
        <Row
          label="Ontvangt u een uitkering"
          value={yesNo(data.employee.receivesBenefits)}
        />

        <Text style={styles.heading}>Contract gegevens</Text>
        <Row label="Ingangsdatum contract" value={start} />
        <Row label="Einddatum contract" value={end} />
        <Row label="Proeftijd" value="Ja" />
        <Row label="Contract bepaald/onbepaald" value="Bepaald" />
        <Row label="Brutosalaris" value={`${wage} per uur`} />
        <Row label="Vergoedingen" value="Nee" />
        <Row label="Contracturen" value="Nee" />
        <Row label="Functie" value={jobTitle} />
        <Row label="Vestiging" value="Amsterdam" />

        <Text style={styles.heading}>Arbeidsvoorwaarden</Text>
        <Row label="Reiskostenvergoeding" value="Nee" />
        <Row label="Leaseauto" value="Nee" />
        <Row label="Pensioenpremie" value="Nee" />
        <Row label="Vakantiedagen" value="Nee" />

        <Text style={{ marginTop: 16 }}>Amsterdam, {signedOn}</Text>

        <View style={styles.signatures}>
          <View style={styles.signatureCol}>
            <Text>Handtekening werkgever</Text>
            <View style={styles.signatureBox}>
              {isValidSignatureDataUrl(data.employerSignatureData) ? (
                <Image
                  src={data.employerSignatureData!}
                  style={styles.signatureImage}
                />
              ) : (
                <Text style={styles.muted}>Nog te ondertekenen</Text>
              )}
            </View>
            <Text style={styles.muted}>{EMPLOYER.company}</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text>Handtekening werknemer</Text>
            <View style={styles.signatureBox}>
              {isValidSignatureDataUrl(data.employeeSignatureData) ? (
                <Image
                  src={data.employeeSignatureData!}
                  style={styles.signatureImage}
                />
              ) : (
                <Text style={styles.muted}>Nog te ondertekenen</Text>
              )}
            </View>
            <Text style={styles.muted}>{name}</Text>
          </View>
        </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateOproepovereenkomstPdf(
  data: ContractDocumentData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<OproepDocument data={data} />);
  return Buffer.from(buffer);
}
