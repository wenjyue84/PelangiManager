import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMinus, ArrowUpDown, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GuestDetailsModal from "./guest-details-modal";
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

function getGenderIcon(gender?: string) {
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

interface SwipeableGuestRowProps {
  guest: Guest;
  onCheckout: (guestId: string) => void;
  onGuestClick: (guest: Guest) => void;
  isCondensedView: boolean;
  children: React.ReactNode;
  isCheckingOut?: boolean;
}

function SwipeableGuestRow({ guest, onCheckout, onGuestClick, isCondensedView, children, isCheckingOut }: SwipeableGuestRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const maxSwipeRef = useRef<number>(0);
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  const SWIPE_THRESHOLD = 80; // Minimum swipe distance to trigger checkout
  const MAX_SWIPE = 120; // Maximum visual swipe distance

  const handleStart = useCallback((clientX: number) => {
    if (isCheckingOut) return;
    startXRef.current = clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
    maxSwipeRef.current = 0;
  }, [isCheckingOut]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isCheckingOut) return;
    
    const diff = startXRef.current - clientX; // Positive when swiping left
    if (diff > 0) { // Only allow left swipe
      const clampedOffset = Math.min(diff, MAX_SWIPE);
      setSwipeOffset(clampedOffset);
      maxSwipeRef.current = Math.max(maxSwipeRef.current, clampedOffset);
    }
  }, [isDragging, isCheckingOut]);

  const handleEnd = useCallback(() => {
    if (!isDragging || isCheckingOut) return;
    
    const swipeTime = Date.now() - startTimeRef.current;
    const shouldCheckout = maxSwipeRef.current >= SWIPE_THRESHOLD || 
                          (maxSwipeRef.current >= 50 && swipeTime < 300); // Quick swipe threshold
    
    setIsDragging(false);
    
    if (shouldCheckout) {
      // Keep the swipe visual during checkout
      setSwipeOffset(MAX_SWIPE);
      onCheckout(guest.id);
    } else {
      // Animate back to original position
      setSwipeOffset(0);
    }
  }, [isDragging, isCheckingOut, guest.id, onCheckout]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Reset swipe state when checkout completes
  useEffect(() => {
    if (!isCheckingOut && swipeOffset > 0) {
      const timer = setTimeout(() => setSwipeOffset(0), 100);
      return () => clearTimeout(timer);
    }
  }, [isCheckingOut, swipeOffset]);

  const swipeProgress = Math.min(swipeOffset / SWIPE_THRESHOLD, 1);
  const backgroundColor = swipeProgress > 0 
    ? `rgba(239, 68, 68, ${0.1 + swipeProgress * 0.2})` // Red background with increasing opacity
    : 'transparent';

  return (
    <tr
      ref={rowRef}
      className={`hover:bg-gray-50 transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isCheckingOut ? 'opacity-75' : ''} relative`}
      style={{
        transform: `translateX(-${swipeOffset}px)`,
        backgroundColor,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out, background-color 0.2s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={isDragging ? handleMouseUp : undefined}
      onMouseLeave={isDragging ? handleMouseUp : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Checkout action revealed during swipe */}
      {swipeOffset > 10 && (
        <td 
          className="absolute right-0 top-0 h-full flex items-center justify-center px-4 pointer-events-none"
          style={{ 
            width: `${Math.min(swipeOffset, MAX_SWIPE)}px`,
            backgroundColor: swipeProgress >= 1 ? '#dc2626' : '#ef4444',
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="flex items-center text-white font-medium text-sm">
            {swipeProgress >= 1 ? (
              <>
                <UserMinus className="h-4 w-4 mr-1" />
                {isCheckingOut ? 'Checking out...' : 'Release to checkout'}
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Swipe to checkout
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

export default function SortableGuestTable() {
  const queryClient = useQueryClient();
  const [isCondensedView, setIsCondensedView] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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

  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedGuest(null);
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    <div className="flex items-center gap-1">
                      Capsule
                      <SortButton field="capsuleNumber" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  {!isCondensedView && (
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                  )}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      {isCondensedView ? 'In' : 'Check-in'}
                      <SortButton field="checkinTime" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      {isCondensedView ? 'Out' : 'Expected Checkout'}
                      <SortButton field="expectedCheckoutDate" currentSort={sortConfig} onSort={handleSort} />
                    </div>
                  </th>
                  {!isCondensedView && (
                    <>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </>
                  )}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedGuests.map((guest) => {
                  const genderIcon = getGenderIcon(guest.gender || undefined);
                  const isGuestCheckingOut = checkoutMutation.isPending && checkoutMutation.variables === guest.id;
                  return (
                    <SwipeableGuestRow
                      key={guest.id}
                      guest={guest}
                      onCheckout={handleCheckout}
                      onGuestClick={handleGuestClick}
                      isCondensedView={isCondensedView}
                      isCheckingOut={isGuestCheckingOut}
                    >
                      {/* Capsule column - sticky first column */}
                      <td className="px-2 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                        <Badge variant="outline" className="bg-blue-600 text-white border-blue-600">
                          {guest.capsuleNumber}
                        </Badge>
                      </td>
                      {/* Guest column */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 ${genderIcon.bgColor} rounded-full flex items-center justify-center mr-2`}>
                            {isCondensedView ? (
                              <span className={`${genderIcon.textColor} font-bold text-xs`}>
                                {getFirstInitial(guest.name)}
                              </span>
                            ) : genderIcon.icon ? (
                              <span className={`${genderIcon.textColor} font-bold text-sm`}>{genderIcon.icon}</span>
                            ) : (
                              <span className={`${genderIcon.textColor} font-medium text-xs`}>{getInitials(guest.name)}</span>
                            )}
                          </div>
                          {!isCondensedView && (
                            <button 
                              onClick={() => handleGuestClick(guest)}
                              className="text-sm font-medium text-hostel-text hover:text-orange-700 hover:underline cursor-pointer transition-colors"
                            >
                              {truncateName(guest.name)}
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Nationality column - only in detailed view */}
                      {!isCondensedView && (
                        <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                          {guest.nationality ? (
                            <span className="font-medium">{guest.nationality}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      {/* Check-in column */}
                      <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                        {isCondensedView 
                          ? formatShortDate(guest.checkinTime.toString())
                          : formatShortDateTime(guest.checkinTime.toString())
                        }
                      </td>
                      {/* Checkout column */}
                      <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                        {guest.expectedCheckoutDate ? (
                          <span className="font-medium">
                            {formatShortDate(guest.expectedCheckoutDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {/* Payment and Status columns - only in detailed view */}
                      {!isCondensedView && (
                        <>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-600">
                            {guest.paymentAmount ? (
                              <div>
                                <div className="font-medium">RM {guest.paymentAmount}</div>
                                <div className="text-xs text-gray-500">{guest.paymentCollector || 'N/A'}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No payment</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </td>
                        </>
                      )}
                      {/* Actions column */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={checkoutMutation.isPending}
                          className="text-hostel-error hover:text-red-700 font-medium p-1"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </td>
                    </SwipeableGuestRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      
      <GuestDetailsModal 
        guest={selectedGuest}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  );
}