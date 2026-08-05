import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let configured = false;

export function getGoogleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export async function loadPlacesLibrary() {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
  }

  if (!configured) {
    setOptions({
      key: apiKey,
      v: "weekly",
      language: "nl",
      region: "NL",
    });
    configured = true;
  }

  return importLibrary("places");
}
