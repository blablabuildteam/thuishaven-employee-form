"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClickableTableRow({
  href,
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableRow> & {
  href: string;
}) {
  const router = useRouter();

  return (
    <TableRow
      role="link"
      tabIndex={0}
      className={cn("cursor-pointer hover:bg-muted/50", className)}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      {...props}
    >
      {children}
    </TableRow>
  );
}
