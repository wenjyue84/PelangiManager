import OccupancyCards from "@/components/occupancy-cards";
import GuestTable from "@/components/guest-table";
import DailyNotifications from "@/components/daily-notifications";

export default function Dashboard() {
  return (
    <div>
      <DailyNotifications />
      <OccupancyCards />
      <GuestTable />
    </div>
  );
}