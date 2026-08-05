"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getGoogleMapsApiKey, loadPlacesLibrary } from "@/lib/google-maps";
import { parseGoogleAddressComponents, type ParsedAddress } from "@/lib/address";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  label: string;
  prediction: google.maps.places.PlacePrediction;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: ParsedAddress) => void;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  className,
}: AddressAutocompleteProps) {
  const listId = useId();
  const apiKey = getGoogleMapsApiKey();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    let cancelled = false;
    loadPlacesLibrary()
      .then((places) => {
        if (cancelled) return;
        sessionTokenRef.current = new places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Adreszoeken kon niet worden geladen.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshSessionToken = useCallback(async () => {
    const places = await loadPlacesLibrary();
    sessionTokenRef.current = new places.AutocompleteSessionToken();
  }, []);

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!ready || input.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { AutocompleteSuggestion } = await loadPlacesLibrary();
        const { suggestions: results } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            includedRegionCodes: ["nl"],
            language: "nl",
            region: "nl",
            sessionToken: sessionTokenRef.current ?? undefined,
          });

        const next: Suggestion[] = (results ?? [])
          .map((item, index) => {
            const prediction = item.placePrediction;
            if (!prediction) return null;
            return {
              id: prediction.placeId || `suggestion-${index}`,
              label:
                prediction.text?.text ||
                prediction.mainText?.text ||
                "Adres",
              prediction,
            };
          })
          .filter((item): item is Suggestion => item !== null);

        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(next.length > 0 ? 0 : -1);
      } catch {
        setSuggestions([]);
        setOpen(false);
        setError("Geen adressen gevonden. Vul handmatig in.");
      } finally {
        setLoading(false);
      }
    },
    [ready],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 250);
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setLoading(true);
    setError(null);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      const parsed = parseGoogleAddressComponents(place.addressComponents);
      if (!parsed) {
        setError("Kon dit adres niet uitlezen. Vul handmatig in.");
        return;
      }

      onAddressSelect(parsed);
      setQuery(place.formattedAddress || suggestion.label);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      await refreshSessionToken();
    } catch {
      setError("Adres ophalen mislukt. Vul handmatig in.");
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) return null;

  return (
    <div ref={containerRef} className={cn("relative space-y-1.5", className)}>
      <label className="th-label" htmlFor="address-search">
        Zoek adres
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="address-search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          placeholder="Begin met typen, bijv. Keizersgracht 42 Amsterdam"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault();
              void selectSuggestion(suggestions[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          className="pl-9 pr-9"
          disabled={!ready}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto border border-th-ink bg-white shadow-sm"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === activeIndex}>
              <button
                id={`${listId}-option-${index}`}
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-th-ink text-white"
                    : "hover:bg-th-cream",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => void selectSuggestion(suggestion)}
              >
                <MapPin
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    index === activeIndex ? "text-white/80" : "text-muted-foreground",
                  )}
                />
                <span>{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Selecteer een adres om straat, huisnummer, postcode en plaats in te vullen.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
