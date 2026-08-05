"use client";

import { useState } from "react";
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
  /** birth = past dates + year dropdown; event = nearby dates */
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
  const today = new Date();

  const startMonth =
    variant === "birth"
      ? new Date(today.getFullYear() - 80, 0)
      : new Date(today.getFullYear() - 1, 0);
  const endMonth =
    variant === "birth"
      ? today
      : new Date(today.getFullYear() + 2, 11);

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
          "flex h-10 w-full items-center justify-between border bg-white px-3 text-left text-base outline-none transition-colors md:text-sm",
          complete
            ? "border-th-green focus-visible:ring-2 focus-visible:ring-th-green/25"
            : "border-th-ink focus-visible:ring-2 focus-visible:ring-th-ink/20",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
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
          endMonth={endMonth}
          selected={selected}
          defaultMonth={selected ?? (variant === "birth" ? new Date(2000, 0) : today)}
          disabled={variant === "birth" ? { after: today } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
            onBlur?.();
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
      </PopoverContent>
    </Popover>
  );
}
