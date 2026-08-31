import { signOut } from "@/lib/auth";
import { switchLocationAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

type LocationOption = { id: string; name: string };

export function Topbar({
  userName,
  role,
  locations,
  currentLocationId,
}: {
  userName?: string | null;
  role: string;
  locations: LocationOption[];
  currentLocationId?: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <form action={switchLocationAction} className="flex items-center gap-2">
        <select
          name="locationId"
          defaultValue={currentLocationId}
          className="h-9 rounded-md border bg-white px-3 text-sm"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Switch
        </Button>
      </form>
      <div className="flex items-center gap-3 text-sm">
        <div className="text-right">
          <div className="font-medium">{userName}</div>
          <div className="text-xs capitalize text-muted-foreground">{role.replace("_", " ")}</div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
