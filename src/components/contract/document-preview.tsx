import Image from "next/image";
import { HUISHOUDELIJK_REGLEMENT, EMPLOYER } from "@/lib/contracts/copy";
import {
  formatContractDate,
  fullAddress,
  fullName,
  genderLabel,
  maritalLabel,
  yesNo,
  type ContractDocumentData,
} from "@/lib/contracts/pdf-data";
import { formatCurrency } from "@/lib/format";

function ContractBrandBanner({ subtitle }: { subtitle: string }) {
  return (
    <header className="flex flex-col items-center border-b-2 border-th-ink bg-th-cream px-4 py-5 text-center">
      <Image
        src="/brand/totem.png"
        alt=""
        width={56}
        height={56}
        className="mb-2 size-14 object-contain mix-blend-multiply"
      />
      <p className="th-heading text-xl tracking-[0.28em]">THUISHAVEN</p>
      <p className="th-heading mt-1 text-xs tracking-[0.18em] text-th-muted uppercase">
        {subtitle}
      </p>
      <span className="mt-3 block h-1 w-12 bg-th-teal" aria-hidden />
    </header>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 border-b border-th-ink/15 py-2 sm:grid-cols-2 sm:gap-4">
      <dt className="th-label text-th-muted">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export function ContractDocumentPreview({ data }: { data: ContractDocumentData }) {
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
    <article className="overflow-hidden bg-white text-base leading-relaxed">
      <ContractBrandBanner subtitle="Oproepovereenkomst" />
      <div className="space-y-5 bg-th-cream/40 px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="th-heading text-2xl tracking-[0.08em]">
        Oproepovereenkomst voor bepaalde tijd
      </h2>
      <p>De ondergetekenden</p>
      <p>
        {EMPLOYER.company} gevestigd te {EMPLOYER.address}, ingeschreven bij de
        Kamer van Koophandel onder nummer {EMPLOYER.kvk}.
      </p>
      <p>Hierna te noemen “werkgever”</p>
      <p>en</p>
      <p>Naam: {name}</p>
      <p>Geb. datum: {dob}</p>
      <p>Adres: {address}</p>
      <p>Hierna te noemen “oproepkracht”</p>
      <p>Verklaren te zijn overeengekomen als volgt</p>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 1. Indiensttreding</h3>
        <p>
          De werknemer treedt met ingang van {start} voor twaalf maanden in
          dienst van de werkgever als oproepkracht voor het verrichten van
          werkzaamheden als {jobTitleLower}. Er is geen vast aantal uren
          overeengekomen. De arbeidsovereenkomst eindigt van rechtswege op {end}.
        </p>
        <p>
          Op de arbeidsovereenkomst is geen collectieve arbeidsovereenkomst van
          toepassing.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 2. Proeftijd</h3>
        <p>De wederzijdse proeftijd bedraagt één maand.</p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 3. Oproeping</h3>
        <p>
          Uitsluitend de werkgever bepaalt of er werkzaamheden zijn die
          rechtvaardigen dat de oproepkracht wordt opgeroepen. Werkgever zorgt
          ervoor dat de oproep steeds tijdig geschiedt. De tijdstippen waarop de
          werkzaamheden worden verricht kunnen variëren en worden overlegd met
          de oproepkracht.
        </p>
        <p>
          De oproepkracht zal, indien opgeroepen en beschikbaar, bij de
          werkgever werkzaamheden verrichten in de functie van {jobTitle}. De werkzaamheden vinden plaats te Amsterdam.
        </p>
        <p>
          De oproepkracht dient tenminste 15 minuten voor aanvang dienst
          aanwezig te zijn.
        </p>
        <p>
          De oproepkracht heeft alleen recht op loon indien hij daadwerkelijk
          als oproepkracht door de werkgever is opgeroepen en deze oproep heeft
          geaccepteerd.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 4. Loon</h3>
        <p>
          Het loon is exclusief 8% vakantiegeld, vakantierechten en overige
          reserveringen. Alle reserveringen voor opbouw vakantiegeld,
          vakantierechten en overige reserveringen zijn niet opgenomen in het
          bruto uurloon. Alle reserveringen als hierboven genoemd worden niet
          gereserveerd en uitbetaald samen met het loon op de vijftiende van de
          daaropvolgende maand. Iedere maand wordt er een loonstrook verstrekt
          in je eigen XPS-logic account.
        </p>
        <p>Het loon bedraagt {wage} bruto per uur.</p>
        <p>
          Gedurende de eerste zes maanden heeft de oproepkracht ingevolge
          artikel 7:628 lid 5 BW alleen recht op loon wanneer hij daadwerkelijk
          heeft gewerkt.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 5. Arbeidsongeschiktheid</h3>
        <p>
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
          geworden.
        </p>
        <p>
          Bij ziekte dient men tenminste twee uur voor de dienst telefonisch
          contact op te nemen met de desbetreffende leidinggevende.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 6. Pensioen</h3>
        <p>Er wordt geen pensioenregeling aangeboden.</p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 7. Vakantie en rooster</h3>
        <p>Per daadwerkelijk gewerkt uur bouwt de oproepkracht 0,052 uur op.</p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 8. Geheimhoudingsplicht</h3>
        <p>
          Oproepkracht is ook na het einde van de overeenkomst verplicht tot
          geheimhouding van al hetgeen hij bij de uitoefening van zijn
          werkzaamheden met betrekking tot de zaken en belangen van de werkgever
          te weten is gekomen. Het niet nakomen van deze geheimhoudingsplicht
          maakt de oproepkracht schadeplichtig.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="th-heading text-lg text-th-green">Artikel 9. Opzegging</h3>
        <p>
          Werkgever en werknemer kunnen de arbeidsovereenkomst tussentijds
          opzeggen met inachtneming van de wettelijke opzegtermijn. De opzegging
          gebeurt tegen het einde van de maand.
        </p>
        <p>
          Oproepkracht verklaart zich bekend te zijn met artikel 7:677 BW
          “Opzegging wegens dringende reden”.
        </p>
      </section>

      <section>
        <h3 className="th-heading mb-3 text-lg text-th-green">
          Werkgever {EMPLOYER.company}
        </h3>
        <h4 className="th-heading mb-2 text-base text-th-green">Persoonlijke gegevens</h4>
        <dl>
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
        </dl>
      </section>

      <section>
        <h4 className="th-heading mb-2 text-base text-th-green">Contract gegevens</h4>
        <dl>
          <Row label="Ingangsdatum contract" value={start} />
          <Row label="Einddatum contract" value={end} />
          <Row label="Proeftijd" value="Ja" />
          <Row label="Contract bepaald/onbepaald" value="Bepaald" />
          <Row label="Brutosalaris" value={`${wage} per uur`} />
          <Row label="Vergoedingen" value="Nee" />
          <Row label="Contracturen" value="Nee" />
          <Row label="Functie" value={jobTitle} />
          <Row label="Vestiging" value="Amsterdam" />
        </dl>
      </section>

      <section>
        <h4 className="th-heading mb-2 text-base text-th-green">Arbeidsvoorwaarden</h4>
        <dl>
          <Row label="Reiskostenvergoeding" value="Nee" />
          <Row label="Leaseauto" value="Nee" />
          <Row label="Pensioenpremie" value="Nee" />
          <Row label="Vakantiedagen" value="Nee" />
        </dl>
      </section>

      <p>
        Amsterdam, {signedOn}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <p>
          <span className="th-label">Handtekening werkgever</span>
          <br />
          {data.employerSignatureData ? "Ondertekend" : "Nog te ondertekenen"}
          <br />
          {EMPLOYER.company}
        </p>
        <p>
          <span className="th-label">Handtekening werknemer</span>
          <br />
          {name}
        </p>
      </div>
      </div>
    </article>
  );
}

export function ReglementPreview() {
  return (
    <article className="overflow-hidden bg-white text-base leading-relaxed">
      <ContractBrandBanner subtitle="Huishoudelijk reglement" />
      <div className="space-y-5 bg-th-cream/40 px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="th-heading text-2xl tracking-[0.08em]">
        {HUISHOUDELIJK_REGLEMENT.title}
      </h2>
      {HUISHOUDELIJK_REGLEMENT.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h3 className="th-heading text-lg text-th-green">{section.heading}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          {"bullets" in section && section.bullets ? (
            <ul className="list-disc space-y-1 pl-5">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      </div>
    </article>
  );
}
