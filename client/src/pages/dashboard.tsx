import SortableGuestTable from "@/components/sortable-guest-table";
import DailyNotifications from "@/components/daily-notifications";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: occupancy } = useQuery<{ total: number; occupied: number; available: number; occupancyRate: number }>({
    queryKey: ["/api/occupancy"],
  });

  const titleSuffix = occupancy ? ` (${occupancy.occupied}/${occupancy.total})` : "";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Dashboard{titleSuffix}</h1>
      </div>
      <DailyNotifications />
      <SortableGuestTable />
    </div>
  );
}