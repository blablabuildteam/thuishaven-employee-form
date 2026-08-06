import type { FormData } from "@/lib/validations";

/** Local-only fixture — imported only from development UI. */
export const DEV_TEST_FORM_DATA: FormData = {
  firstName: "Yannith",
  lastName: "Oostervoor",
  dateOfBirth: "1999-11-02",
  // Nearest valid 11-proef to the BSN used in manual testing
  bsn: "212335273",
  street: "Witte de Withstraat",
  houseNumber: "184A",
  postalCode: "1057 ZL",
  city: "Amsterdam",
  phone: "0649069600",
  email: "yannith.oost@gmail.com",
  // Known-valid NL example IBAN (manual test IBAN failed checksum)
  iban: "NL91 ABNA 0417 1643 00",
  eventDate: "2023-08-04",
  department: "RM",
  startTime: "10:00",
  endTime: "01:00",
  breakMinutes: 0,
  // Minimal 1×1 PNG so submit can succeed without drawing
  signatureData:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  honeypot: "",
};
