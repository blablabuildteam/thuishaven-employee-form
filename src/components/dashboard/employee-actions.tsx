"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Download, Unlock } from "lucide-react";
import { unblockEmployee } from "@/app/dashboard/actions";

interface EmployeeActionsProps {
  employeeId: string;
  isBlocked: boolean;
  lastSubmissionId?: string;
}

export function EmployeeActions({
  employeeId,
  isBlocked,
  lastSubmissionId,
}: EmployeeActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/employees/${employeeId}`)}
        >
          <Eye className="size-4" />
          Bekijk details
        </DropdownMenuItem>
        {lastSubmissionId && (
          <DropdownMenuItem
            render={
              <a
                href={`/api/dashboard/submissions/${lastSubmissionId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Download className="size-4" />
            Download laatste PDF
          </DropdownMenuItem>
        )}
        {isBlocked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isPending}
              onClick={() =>
                startTransition(() => unblockEmployee(employeeId))
              }
            >
              <Unlock className="size-4" />
              Deblokkeer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
