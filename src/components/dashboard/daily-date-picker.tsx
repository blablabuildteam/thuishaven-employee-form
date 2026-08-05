"use client";

import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";

interface DailyDatePickerProps {
  currentDate: string;
}

export function DailyDatePicker({ currentDate }: DailyDatePickerProps) {
  const router = useRouter();
  const date = parseISO(currentDate);

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" />}
        className="justify-start text-left font-normal"
      >
        <CalendarDays className="size-4" />
        {format(date, "d MMMM yyyy", { locale: nl })}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              router.push(
                `/dashboard/daily?date=${format(newDate, "yyyy-MM-dd")}`
              );
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
