import OccupancyCards from "@/components/occupancy-cards";
import SortableGuestTable from "@/components/sortable-guest-table";
import DailyNotifications from "@/components/daily-notifications";

export default function Dashboard() {
  return (
    <div>
      <DailyNotifications />
      <OccupancyCards />
      <SortableGuestTable />
    </div>
  );
}