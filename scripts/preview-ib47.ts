import { writeFileSync } from "fs";
import { generateIB47PDF } from "../src/lib/pdf/generate-ib47";

async function main() {
const pdf = await generateIB47PDF({
  employee: {
    firstName: "Yannith",
    lastName: "Oostervoor",
    dateOfBirth: "1999-11-02",
    bsn: "212335273",
    street: "Witte de Withstraat",
    houseNumber: "184A",
    postalCode: "1057 ZL",
    city: "Amsterdam",
    phone: "0649069600",
    email: "yannith.oost@gmail.com",
    iban: "NL91 ABNA 0417 1643 00",
  },
  submission: {
    eventDate: "2023-08-04",
    department: "Bar",
    startTime: "10:00",
    endTime: "01:00",
    breakMinutes: 0,
    hourlyRate: 15,
    totalHours: 15,
    totalPay: 225,
    signatureData:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  },
});

writeFileSync("/tmp/ib47-preview.pdf", pdf);

const text = pdf.toString("latin1");
const pageCount = (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
console.log(`bytes=${pdf.length} pages=${pageCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
