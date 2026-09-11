"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { nl as nlDateFns } from "date-fns/locale";
import { nl } from "react-day-picker/locale";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FormDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** birth = past dates + year dropdown; event = up to today */
  variant?: "birth" | "event";
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  complete?: boolean;
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

function partsFromValue(value?: string) {
  const parsed = toDate(value);
  if (!parsed) {
    return { day: "", month: "", year: "" };
  }
  return {
    day: format(parsed, "dd"),
    month: format(parsed, "MM"),
    year: format(parsed, "yyyy"),
  };
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function dateFromParts(day: string, month: string, year: string): Date | null {
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || y < 1900) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function fieldClass(complete?: boolean, ariaInvalid?: boolean, disabled?: boolean) {
  return cn(
    "flex h-10 w-full items-center border bg-white px-3 text-base outline-none transition-colors md:text-sm",
    complete
      ? "border-th-green focus-within:ring-2 focus-within:ring-th-green/25"
      : "border-th-ink focus-within:ring-2 focus-within:ring-th-ink/20",
    disabled && "cursor-not-allowed bg-muted opacity-50",
    ariaInvalid && "border-destructive ring-2 ring-destructive/20",
  );
}

function DateCalendar({
  variant,
  selected,
  onSelect,
}: {
  variant: "birth" | "event";
  selected?: Date;
  onSelect: (date: Date) => void;
}) {
  const today = new Date();
  const startMonth =
    variant === "birth"
      ? new Date(today.getFullYear() - 80, 0)
      : new Date(today.getFullYear() - 1, 0);

  return (
    <>
      <div className="border-b border-th-ink/15 px-3 py-2">
        <p className="th-heading text-xs tracking-[0.16em] text-th-muted">
          {variant === "birth" ? "Geboortedatum" : "Datum kiezen"}
        </p>
      </div>
      <Calendar
        mode="single"
        locale={nl}
        captionLayout="dropdown"
        startMonth={startMonth}
        endMonth={today}
        selected={selected}
        defaultMonth={selected ?? (variant === "birth" ? new Date(2000, 0) : today)}
        disabled={{ after: today }}
        onSelect={(date) => {
          if (!date) return;
          onSelect(date);
        }}
        className="rounded-none bg-th-cream p-3 [--cell-radius:0px] [--cell-size:2.25rem]"
        classNames={{
          month: "gap-3",
          month_caption: "relative flex h-9 items-center justify-center",
          nav: "absolute inset-x-0 top-0 flex items-center justify-between",
          button_previous:
            "rounded-none border border-th-ink/25 bg-white hover:bg-white",
          button_next:
            "rounded-none border border-th-ink/25 bg-white hover:bg-white",
          dropdowns: "relative z-10 flex items-center justify-center gap-2",
          dropdown_root:
            "relative inline-flex h-8 min-w-[4.5rem] items-center rounded-none border border-th-ink/30 bg-white px-2",
          caption_label:
            "th-heading flex items-center gap-1 text-xs tracking-[0.08em] [&>svg]:size-3.5",
          dropdown: "absolute inset-0 z-20 cursor-pointer opacity-0",
          weekday:
            "th-heading flex-1 text-[0.65rem] font-semibold tracking-[0.12em] text-th-muted",
          today: "bg-accent/35 text-foreground",
        }}
        formatters={{
          formatMonthDropdown: (date) =>
            format(date, "MMM", { locale: nlDateFns }).toUpperCase(),
        }}
      />
    </>
  );
}

export function FormDatePicker({
  value,
  onChange,
  onBlur,
  placeholder = "Kies een datum",
  variant = "event",
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  complete,
}: FormDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const [day, setDay] = useState(() => partsFromValue(value).day);
  const [month, setMonth] = useState(() => partsFromValue(value).month);
  const [year, setYear] = useState(() => partsFromValue(value).year);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = partsFromValue(value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  function commitDate(date: Date) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) return;
    onChange(format(date, "yyyy-MM-dd"));
  }

  function applyParts(nextDay: string, nextMonth: string, nextYear: string) {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);
    if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
      return;
    }
    const date = dateFromParts(nextDay, nextMonth, nextYear);
    if (date) commitDate(date);
  }

  function handleCalendarSelect(date: Date) {
    commitDate(date);
    setDay(format(date, "dd"));
    setMonth(format(date, "MM"));
    setYear(format(date, "yyyy"));
    setOpen(false);
    onBlur?.();
  }

  if (variant === "birth") {
    return (
      <div className={fieldClass(complete, ariaInvalid, disabled)}>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <input
            id={id}
            inputMode="numeric"
            autoComplete="bday-day"
            placeholder="DD"
            maxLength={2}
            disabled={disabled}
            aria-invalid={ariaInvalid || undefined}
            aria-label="Dag"
            value={day}
            onChange={(event) => {
              const next = digitsOnly(event.target.value, 2);
              applyParts(next, month, year);
              if (next.length === 2) monthRef.current?.focus();
            }}
            onBlur={() => {
              if (day.length === 1) applyParts(day.padStart(2, "0"), month, year);
              onBlur?.();
            }}
            className="w-8 bg-transparent text-center font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/55 disabled:cursor-not-allowed"
          />
          <span className="text-muted-foreground/55" aria-hidden>
            /
          </span>
          <input
            ref={monthRef}
            inputMode="numeric"
            autoComplete="bday-month"
            placeholder="MM"
            maxLength={2}
            disabled={disabled}
            aria-label="Maand"
            value={month}
            onChange={(event) => {
              const next = digitsOnly(event.target.value, 2);
              applyParts(day, next, year);
              if (next.length === 2) yearRef.current?.focus();
            }}
            onBlur={() => {
              if (month.length === 1) applyParts(day, month.padStart(2, "0"), year);
              onBlur?.();
            }}
            className="w-8 bg-transparent text-center font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/55 disabled:cursor-not-allowed"
          />
          <span className="text-muted-foreground/55" aria-hidden>
            /
          </span>
          <input
            ref={yearRef}
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder="JJJJ"
            maxLength={4}
            disabled={disabled}
            aria-label="Jaar"
            value={year}
            onChange={(event) => {
              applyParts(day, month, digitsOnly(event.target.value, 4));
            }}
            onBlur={onBlur}
            className="w-12 bg-transparent text-center font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/55 disabled:cursor-not-allowed"
          />
        </div>
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) onBlur?.();
          }}
        >
          <PopoverTrigger
            disabled={disabled}
            aria-label="Kalender openen"
            className="shrink-0 text-muted-foreground outline-none disabled:cursor-not-allowed"
          >
            <CalendarDays className="size-4" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            className="w-auto overflow-hidden rounded-none border border-th-ink bg-th-cream p-0 shadow-none ring-0"
          >
            <DateCalendar
              variant="birth"
              selected={selected}
              onSelect={handleCalendarSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid || undefined}
        className={cn(
          fieldClass(complete, ariaInvalid, disabled),
          "justify-between text-left focus-visible:ring-2",
        )}
      >
        <span
          className={cn(
            selected
              ? "font-medium text-foreground"
              : "font-normal text-muted-foreground/55",
          )}
        >
          {selected
            ? format(selected, "d MMMM yyyy", { locale: nlDateFns })
            : placeholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto overflow-hidden rounded-none border border-th-ink bg-th-cream p-0 shadow-none ring-0"
      >
        <DateCalendar
          variant="event"
          selected={selected}
          onSelect={handleCalendarSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
