import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMinus, ArrowUpDown, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Eye, List, Grid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Guest } from "@shared/schema";

type SortField = 'name' | 'capsuleNumber' | 'checkinTime' | 'expectedCheckoutDate';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string): string {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

function truncateName(name: string): string {
  return name.length > 5 ? name.slice(0, 5) + '...' : name;
}

function getFirstInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getGenderIcon(gender?: string | null) {
  if (gender === 'female') {
    return { icon: '♀', bgColor: 'bg-pink-100', textColor: 'text-pink-600' };
  } else if (gender === 'male') {
    return { icon: '♂', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
  }
  // For other/unspecified/no gender - use purple
  return { icon: null, bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
}

function formatShortDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  
  return `${month}/${day} ${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${month}/${day}`;
}

function SortButton({ field, currentSort, onSort }: {
  field: SortField;
  currentSort: { field: SortField; order: SortOrder };
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort.field === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
    >
      {isActive ? (
        currentSort.order === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}

export default function SortableGuestTable() {
  const queryClient = useQueryClient();
  const [isCondensedView, setIsCondensedView] = useState(true); // Default to condensed view (mobile-first)
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: 'capsuleNumber',
    order: 'asc'
  });
  
  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests/checked-in"],
  });

  const sortedGuests = useMemo(() => {
    if (!guests.length) return [];
    
    return [...guests].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortConfig.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'capsuleNumber':
          // Extract number for proper sorting (C1, C2, C11, C12, etc.)
          aValue = parseInt(a.capsuleNumber.replace('C', ''));
          bValue = parseInt(b.capsuleNumber.replace('C', ''));
          break;
        case 'checkinTime':
          aValue = new Date(a.checkinTime).getTime();
          bValue = new Date(b.checkinTime).getTime();
          break;
        case 'expectedCheckoutDate':
          aValue = a.expectedCheckoutDate ? new Date(a.expectedCheckoutDate).getTime() : 0;
          bValue = b.expectedCheckoutDate ? new Date(b.expectedCheckoutDate).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [guests, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const checkoutMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const response = await apiRequest("POST", "/api/guests/checkout", { id: guestId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests/checked-in"] });
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guests/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capsules/available"] });
      toast({
        title: "Success",
        description: "Guest checked out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = (guestId: string) => {
    checkoutMutation.mutate(guestId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Currently Checked In</CardTitle>
            <Skeleton className="w-20 h-6" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-hostel-text flex items-center">
            Dashboard
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({guests.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Condensed</span>
            <Switch 
              checked={!isCondensedView}
              onCheckedChange={(checked) => setIsCondensedView(!checked)}
            />
            <span className="text-xs text-gray-600">Detailed</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedGuests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No guests currently checked in</p>
          </div>
        ) : isCondensedView ? (
          // Condensed View - Mobile First with initials and In/Out columns
          <div className="space-y-2">
            {sortedGuests.map((guest) => {
              const genderStyle = getGenderIcon(guest.gender);
              return (
                <div key={guest.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-center space-x-3">
                    {/* Guest Initial Circle with Gender Color */}
                    <div className={`w-10 h-10 rounded-full ${genderStyle.bgColor} ${genderStyle.textColor} flex items-center justify-center font-semibold text-sm`}>
                      {getInitials(guest.name)}
                    </div>
                    
                    {/* Capsule Number */}
                    <div className="text-sm font-medium text-hostel-text">
                      {guest.capsuleNumber}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* In/Out Status */}
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1">
                      In
                    </Badge>
                    
                    {/* Checkout Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckout(guest.id)}
                      disabled={checkoutMutation.isPending}
                      className="text-xs h-7 px-2"
                    >
                      <UserMinus className="h-3 w-3 mr-1" />
                      Out
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Detailed View - Full information table
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    <div className="flex items-center gap-1">
                      Guest
                      <SortButton field="name" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Capsule
                      <SortButton field="capsuleNumber" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Check-in
                      <SortButton field="checkinTime" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Checkout
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedGuests.map((guest) => {
                  const genderStyle = getGenderIcon(guest.gender);
                  return (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full ${genderStyle.bgColor} ${genderStyle.textColor} flex items-center justify-center font-medium text-xs mr-3`}>
                            {getInitials(guest.name)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                            <div className="text-xs text-gray-500">{guest.nationality || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {guest.capsuleNumber}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatShortDateTime(guest.checkinTime)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        <div className="text-sm font-medium">RM {guest.paymentAmount}</div>
                        <div className="text-gray-500">{guest.paymentMethod}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {guest.expectedCheckoutDate ? formatShortDate(guest.expectedCheckoutDate) : 'Not set'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={checkoutMutation.isPending}
                          className="text-xs h-8"
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Check Out
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}