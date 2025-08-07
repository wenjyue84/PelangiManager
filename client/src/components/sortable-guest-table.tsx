import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMinus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Guest } from "@shared/schema";

type SortField = 'name' | 'capsuleNumber' | 'checkinTime' | 'expectedCheckoutDate';
type SortOrder = 'asc' | 'desc';

function getInitials(name: string): string {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-hostel-text">Currently Checked In</CardTitle>
          <Badge variant="secondary" className="bg-hostel-secondary bg-opacity-10 text-hostel-secondary">
            <div className="w-2 h-2 bg-hostel-secondary rounded-full mr-1.5"></div>
            {guests.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {sortedGuests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No guests currently checked in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Capsule
                      <SortButton field="capsuleNumber" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Check-in Time
                      <SortButton field="checkinTime" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Expected Checkout
                      <SortButton field="expectedCheckoutDate" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-hostel-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-hostel-primary font-medium text-sm">{getInitials(guest.name)}</span>
                        </div>
                        <span className="text-sm font-medium text-hostel-text">{guest.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                        {guest.capsuleNumber}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatShortDateTime(guest.checkinTime.toString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.expectedCheckoutDate ? (
                        <span className="font-medium">
                          {formatShortDate(guest.expectedCheckoutDate)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.paymentAmount ? (
                        <div>
                          <div className="font-medium">RM {guest.paymentAmount}</div>
                          <div className="text-xs text-gray-500">{guest.paymentCollector || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No payment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-green-600 text-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></div>
                        Checked In
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCheckout(guest.id)}
                        disabled={checkoutMutation.isPending}
                        className="text-hostel-error hover:text-red-700 font-medium"
                      >
                        <UserMinus className="mr-1 h-4 w-4" />
                        Check Out
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}