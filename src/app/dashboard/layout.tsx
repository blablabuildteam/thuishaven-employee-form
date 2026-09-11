import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardNav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    const { refreshContractExpiryAlerts } = await import(
      "@/lib/contracts/expiry"
    );
    await refreshContractExpiryAlerts();
  } catch {
    // Expiry refresh should not block the dashboard.
  }

  let alertCount = 0;
  try {
    alertCount = await prisma.alert.count({
      where: { acknowledged: false },
    });
  } catch {
    // DB may not be available during initial setup
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardNav
        userName={session.user.name}
        alertCount={alertCount}
      />
      <main className="th-sunburst flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
