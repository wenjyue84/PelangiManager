import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Bed, ArrowLeft, ArrowRight } from "lucide-react";
import { useVisibilityQuery } from "@/hooks/useVisibilityQuery";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guest } from "@shared/schema";

interface DayData {
  date: string;
  checkins: Guest[];
  checkouts: Guest[];
  expectedCheckouts: Guest[];
  occupancy: number;
  totalCapsules: number;
}

interface CalendarData {
  [dateString: string]: DayData;
}

export default function OccupancyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch calendar data for the current month
  const { data: calendarData = {}, isLoading } = useVisibilityQuery<CalendarData>({
    queryKey: ["/api/calendar/occupancy", currentMonth.getFullYear(), currentMonth.getMonth()],
    // Uses smart config: nearRealtime (30s stale, 60s refetch) for calendar data
  });

  const selectedDateData = useMemo(() => {
    if (!selectedDate) return null;
    const dateString = selectedDate.toISOString().split('T')[0];
    return calendarData[dateString] || null;
  }, [selectedDate, calendarData]);

  const getDayContent = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayData = calendarData[dateString];
    
    if (!dayData) return null;

    const occupancyRate = dayData.totalCapsules > 0 ? (dayData.occupancy / dayData.totalCapsules) * 100 : 0;
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <span className="text-sm">{date.getDate()}</span>
        {dayData.checkins.length > 0 && (
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full absolute top-0 right-0"></div>
        )}
        {dayData.checkouts.length > 0 && (
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-0 left-0"></div>
        )}
        {occupancyRate > 80 && (
          <div className="w-full h-1 bg-orange-400 rounded absolute bottom-0"></div>
        )}
        {occupancyRate === 100 && (
          <div className="w-full h-1 bg-red-500 rounded absolute bottom-0"></div>
        )}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Occupancy Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Occupancy Calendar
        </CardTitle>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Check-ins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Check-outs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 bg-orange-400 rounded"></div>
              <span>80%+ Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 bg-red-500 rounded"></div>
              <span>Full</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-24 text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full rounded-md border"
              components={{
                DayContent: ({ date }) => getDayContent(date),
              }}
            />
          </div>
          <div className="space-y-4 md:sticky md:top-20">
            {selectedDateData ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        <span className="text-sm">Occupancy</span>
                      </div>
                      <Badge variant={selectedDateData.occupancy === selectedDateData.totalCapsules ? "destructive" : 
                                   selectedDateData.occupancy > selectedDateData.totalCapsules * 0.8 ? "secondary" : "default"}>
                        {selectedDateData.occupancy}/{selectedDateData.totalCapsules}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Check-ins</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50">
                        {selectedDateData.checkins.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Check-outs</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50">
                        {selectedDateData.checkouts.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Expected Check-outs</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-50">
                        {selectedDateData.expectedCheckouts.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedDateData.checkins.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-green-600">Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedDateData.checkins.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{guest.name}</span>
                            <Badge variant="outline">{guest.capsuleNumber}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedDateData.checkouts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-red-600">Check-outs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedDateData.checkouts.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{guest.name}</span>
                            <Badge variant="outline">{guest.capsuleNumber}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedDateData.expectedCheckouts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-orange-600">Expected Check-outs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedDateData.expectedCheckouts.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{guest.name}</span>
                            <Badge variant="outline">{guest.capsuleNumber}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : selectedDate ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No data available for this date</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Select a date to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}