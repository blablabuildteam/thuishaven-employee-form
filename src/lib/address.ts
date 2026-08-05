export interface ParsedAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

type AddressComponentLike = {
  longText?: string | null;
  shortText?: string | null;
  types?: string[];
};

function formatDutchPostalCode(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  const match = cleaned.match(/^(\d{4})([A-Z]{2})$/);
  if (!match) return raw.trim();
  return `${match[1]} ${match[2]}`;
}

function getComponent(
  components: AddressComponentLike[],
  type: string,
): string {
  const match = components.find((c) => c.types?.includes(type));
  return (match?.longText || match?.shortText || "").trim();
}

/** Parse Google Places addressComponents into NL form fields. */
export function parseGoogleAddressComponents(
  components: AddressComponentLike[] | null | undefined,
): ParsedAddress | null {
  if (!components?.length) return null;

  const street = getComponent(components, "route");
  const streetNumber = getComponent(components, "street_number");
  const subpremise = getComponent(components, "subpremise");
  const postalCode = getComponent(components, "postal_code");
  const city =
    getComponent(components, "locality") ||
    getComponent(components, "postal_town") ||
    getComponent(components, "sublocality") ||
    getComponent(components, "administrative_area_level_2");

  const houseNumber = [streetNumber, subpremise].filter(Boolean).join("-");

  if (!street && !postalCode && !city) return null;

  return {
    street,
    houseNumber,
    postalCode: postalCode ? formatDutchPostalCode(postalCode) : "",
    city,
  };
}
