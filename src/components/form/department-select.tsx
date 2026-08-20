"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departmentOptions } from "@/lib/departments";
import { cn } from "@/lib/utils";

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  "aria-invalid"?: boolean;
  complete?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function DepartmentSelect({
  value,
  onChange,
  onBlur,
  placeholder = "Kies afdeling",
  "aria-invalid": ariaInvalid,
  complete,
  id,
  disabled,
  className,
}: DepartmentSelectProps) {
  const options = departmentOptions(value);

  return (
    <Select
      value={value || null}
      onValueChange={(next) => onChange(next ?? "")}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid || undefined}
        className={cn(
          "h-10 w-full min-w-0 rounded-none border bg-white px-3 text-base font-medium text-foreground md:text-sm data-[size=default]:h-10",
          complete
            ? "border-th-green focus-visible:border-th-green focus-visible:ring-2 focus-visible:ring-th-green/25"
            : "border-input focus-visible:border-th-ink focus-visible:ring-2 focus-visible:ring-th-ink/20",
          "data-placeholder:font-normal data-placeholder:text-muted-foreground/55",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          className,
        )}
        onBlur={onBlur}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger className="rounded-none">
        {options.map((department) => (
          <SelectItem key={department} value={department}>
            {department}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
