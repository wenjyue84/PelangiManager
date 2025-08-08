import { useVisibilityQuery } from "@/hooks/useVisibilityQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guest, PaginatedResponse } from "@shared/schema";

export default function DailyNotifications() {
  const { data: guestsResponse, isLoading } = useVisibilityQuery<PaginatedResponse<Guest>>({
    queryKey: ["/api/guests/checked-in"],
    // Uses smart config: realtime (10s stale, 30s refetch)
  });
  
  const guests = guestsResponse?.data || [];

  // Check for guests checking out today (expected checkout date is today)
  const today = new Date().toISOString().split('T')[0];
  const checkingOutToday = guests.filter(guest => 
    guest.expectedCheckoutDate === today
  );

  // Check for guests past their expected checkout
  const overdueCheckouts = guests.filter(guest => {
    if (!guest.expectedCheckoutDate) return false;
    return guest.expectedCheckoutDate < today;
  });

  const currentHour = new Date().getHours();
  const isNoonTime = currentHour === 12; // 12 PM

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  // Don't show if no notifications
  if (checkingOutToday.length === 0 && overdueCheckouts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-orange-800 flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Daily Checkout Notifications
          {isNoonTime && (
            <Badge className="ml-2 bg-orange-600 text-white">
              <Clock className="mr-1 h-3 w-3" />
              12:00 PM Alert
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Expected Checkouts */}
        {checkingOutToday.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-3 flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Expected Checkouts Today ({checkingOutToday.length})
            </h4>
            <div className="space-y-2">
              {checkingOutToday.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{guest.name}</div>
                      <div className="text-sm text-gray-600">Capsule {guest.capsuleNumber}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      Due Today
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Checkouts */}
        {overdueCheckouts.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h4 className="font-medium text-red-800 mb-3 flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Overdue Checkouts ({overdueCheckouts.length})
            </h4>
            <div className="space-y-2">
              {overdueCheckouts.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{guest.name}</div>
                      <div className="text-sm text-gray-600">Capsule {guest.capsuleNumber}</div>
                      <div className="text-xs text-red-600">
                        Expected: {new Date(guest.expectedCheckoutDate!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-600 text-white">
                      Overdue
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isNoonTime && (
          <div className="text-center text-sm text-orange-700 font-medium">
            ⏰ Daily 12:00 PM checkout reminder - Please follow up with guests
          </div>
        )}
      </CardContent>
    </Card>
  );
}