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
          "flex h-10 w-full items-center justify-between border border-th-ink bg-white px-3 text-left text-base outline-none transition-colors md:text-sm",
          "focus-visible:ring-2 focus-visible:ring-th-ink/20",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          !selected && "text-muted-foreground",
        )}
      >
        <span className={cn(selected && "font-medium text-foreground")}>
          {selected
            ? format(selected, "d MMMM yyyy", { locale: nlDateFns })
            : placeholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto rounded-none border border-th-ink bg-th-cream p-0 shadow-none ring-0"
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
          className="rounded-none bg-th-cream p-3 [--cell-radius:0px] [--cell-size:2.4rem]"
          classNames={{
            month_caption: "th-heading tracking-[0.08em]",
            caption_label: "th-heading text-sm tracking-[0.1em]",
            weekday:
              "th-heading flex-1 text-[0.7rem] font-semibold tracking-[0.12em] text-th-muted",
            today: "bg-accent/40 text-foreground",
            dropdowns: "gap-2",
            dropdown_root:
              "rounded-none border border-th-ink/30 bg-white px-1",
            button_previous:
              "rounded-none border border-th-ink/20 hover:bg-white",
            button_next:
              "rounded-none border border-th-ink/20 hover:bg-white",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
