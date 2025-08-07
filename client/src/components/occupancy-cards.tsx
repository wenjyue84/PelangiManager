import { Bed, Users, Percent, DoorOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OccupancyData {
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number;
}

export default function OccupancyCards() {
  const { data: occupancy, isLoading } = useQuery<OccupancyData>({
    queryKey: ["/api/occupancy"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                </div>
                <div className="ml-4 flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Capsules",
      value: occupancy?.total || 0,
      icon: Bed,
      bgColor: "bg-hostel-primary bg-opacity-10",
      iconColor: "text-hostel-primary",
    },
    {
      title: "Current Guests",
      value: occupancy?.occupied || 0,
      icon: Users,
      bgColor: "bg-hostel-secondary bg-opacity-10",
      iconColor: "text-hostel-secondary",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancy?.occupancyRate || 0}%`,
      icon: Percent,
      bgColor: "bg-hostel-accent bg-opacity-10",
      iconColor: "text-hostel-accent",
    },
    {
      title: "Available",
      value: occupancy?.available || 0,
      icon: DoorOpen,
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`${card.iconColor} h-5 w-5`} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-hostel-text">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}