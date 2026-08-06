"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EmployeeFiltersProps {
  currentSearch: string;
  currentStatus: string;
}

export function EmployeeFilters({
  currentSearch,
  currentStatus,
}: EmployeeFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [, startTransition] = useTransition();

  function navigateWithParams(newSearch: string, newStatus: string) {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus !== "all") params.set("status", newStatus);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard/employees${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            navigateWithParams(e.target.value, currentStatus);
          }}
          className="h-10 pl-9"
        />
      </div>
      <Select
        value={currentStatus}
        onValueChange={(val) => navigateWithParams(search, val ?? "all")}
      >
        <SelectTrigger className="h-10 w-full rounded-none data-[size=default]:h-10 sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          <SelectItem value="active">Actief</SelectItem>
          <SelectItem value="blocked">Geblokkeerd</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
