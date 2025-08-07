import SortableGuestTable from "@/components/sortable-guest-table";
import DailyNotifications from "@/components/daily-notifications";
import AdminNotifications from "@/components/admin-notifications";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyNotifications />
        <AdminNotifications />
      </div>
      <SortableGuestTable />
    </div>
  );
}