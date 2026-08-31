export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Agency, SubAccount } from "@/models/agency";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { Role } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const agency = session.user.agencyId
    ? await Agency.findById(session.user.agencyId)
    : await Agency.findOne();

  const locationQuery =
    session.user.role === "super_admin"
      ? {}
      : session.user.subAccountId && session.user.role.startsWith("subaccount")
        ? { _id: session.user.subAccountId }
        : { agencyId: session.user.agencyId || agency?._id };

  const locations = await SubAccount.find(locationQuery).sort({ name: 1 }).lean();
  const cookieLocation = cookies().get("locationId")?.value;
  const currentLocationId =
    cookieLocation && locations.some((l) => String(l._id) === cookieLocation)
      ? cookieLocation
      : locations[0]
        ? String(locations[0]._id)
        : undefined;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={session.user.role as Role}
        brandName={agency?.name || "AgencyOS"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={session.user.name}
          role={session.user.role}
          currentLocationId={currentLocationId}
          locations={locations.map((l) => ({ id: String(l._id), name: l.name }))}
        />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
