"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, User, Briefcase, MapPin, Building2, AlertCircle, Loader2, Palette, Edit, Save, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingEntry {
  EntryNo: number;
  BookingStartDate: string;
  BookingEndDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingNote: string;
  BookingStatus: string;
  BookingSetupCode: string;
  ServiceName: string;
  StaffCode: string;
  StaffName: string;
  TimeOff: boolean;
  CustomerNo: string;
  Name: string;
  Name2: string;
  PhoneNo: string;
  EMail: string;
  Age: number;
  BirthDate: string;
  Address: string;
  Address2: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    description?: string;
    location?: string;
    staff: string;
    staffCode: string;
    service: string;
    customer: string;
    status: string;
    branch: string;
    room: string;
    rawData?: BookingEntry;
  };
  color: string;
  textColor: string;
}

interface StaffColor {
  code: string;
  name: string;
  color: {
    background: string;
    text: string;
  };
  isEditing?: boolean;
  tempColor?: string;
}

// Default color for all staff
const DEFAULT_COLOR = "#3788d8";
const DEFAULT_TEXT_COLOR = "#ffffff";

export default function BookingCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [staffColors, setStaffColors] = useState<StaffColor[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [updatingColor, setUpdatingColor] = useState<string | null>(null);

  // Get branch code from URL parameter
  const branchCode = searchParams.get('code') || "MAIN";

  // Fetch staff colors from API
const fetchStaffColors = useCallback(async () => {
  try {
    // Get unique staff codes from current events
    const uniqueStaffCodes = [...new Set(events.map(event => event.extendedProps.staffCode).filter(code => code && code !== ""))];
    
    console.log("🎨 Fetching staff colors for codes:", uniqueStaffCodes);
    
    if (uniqueStaffCodes.length === 0) {
      console.log("🎨 No staff codes found, skipping staff colors fetch");
      return;
    }

    const requestBody = {
      staffCodes: uniqueStaffCodes,
      branchCode: branchCode
    };

    console.log("📤 Staff colors request body:", requestBody);
    console.log("📤 Staff colors request body (stringified):", JSON.stringify(requestBody, null, 2));

    const response = await fetch('/api/booking-staff-auth/get-booking-staff-color', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Staff colors response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Staff colors response data:", data);
      
      if (data.staffColors) {
        console.log("🎨 Received staff colors:", data.staffColors);
        // Transform the staff colors data into our StaffColor array
        const transformedStaffColors: StaffColor[] = uniqueStaffCodes.map(code => {
          const colorData = data.staffColors[code] || data.staffColors[code.toUpperCase()];
          const staffEvent = events.find(event => event.extendedProps.staffCode === code);
          
          const staffColor = {
            code,
            name: staffEvent?.extendedProps.staff || code,
            color: colorData || {
              background: DEFAULT_COLOR,
              text: DEFAULT_TEXT_COLOR
            }
          };
          
          console.log(`🎨 Staff ${code} color:`, staffColor);
          return staffColor;
        });
        
        setStaffColors(transformedStaffColors);
        console.log("✅ Final staff colors array:", transformedStaffColors);
      } else {
        console.log("❌ No staffColors in response data");
      }
    } else {
      console.error("❌ Staff colors API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("❌ Staff colors error response:", errorText);
    }
  } catch (error) {
    console.error('❌ Failed to fetch staff colors:', error);
  }
}, [events, branchCode]);

  // Get color for staff member
  const getStaffColor = useCallback((staffCode: string): { background: string; text: string } => {
    const staffColor = staffColors.find(sc => sc.code === staffCode);
    if (staffColor) {
      return staffColor.color;
    }
    
    // Use default color for all staff without specific colors
    return {
      background: DEFAULT_COLOR,
      text: DEFAULT_TEXT_COLOR
    };
  }, [staffColors]);

  // Check if user is admin and fetch bookings
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        console.log("🔍 Starting auth check and fetch...");
        
        // Check authentication via API instead of localStorage
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authResponse.json();
        
        console.log("🔍 Auth API response:", authData);

        if (!authData.authenticated) {
          console.log("❌ Not authenticated, redirecting to signin");
          router.replace("/signin");
          return;
        }

        console.log("✅ User authenticated:", authData.user);

        // Initial fetch with current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        console.log("📅 Fetching initial date range:", { 
          firstDay: firstDay.toISOString(), 
          lastDay: lastDay.toISOString(),
          branchCode 
        });
        
        await fetchBookingEntries(firstDay, lastDay);
        setIsInitialLoad(false);
        console.log("✅ Initial fetch completed");
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        router.replace("/signin");
      }
    };

    checkAuthAndFetch();
  }, [router, branchCode]);

  // Fetch staff colors when events change
  useEffect(() => {
    if (events.length > 0) {
      fetchStaffColors();
    }
  }, [events, fetchStaffColors]);

  // Handle calendar date range changes
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    console.log("📅 Calendar dates set:", {
      start: dateInfo.start.toISOString(),
      end: dateInfo.end.toISOString(),
      isInitialLoad
    });
    
    setCurrentDateRange({
      start: dateInfo.start,
      end: dateInfo.end
    });
    
    // Only fetch if this is not the initial load or if the date range actually changed
    if (!isInitialLoad) {
      console.log("🔄 Fetching entries for new date range");
      fetchBookingEntries(dateInfo.start, dateInfo.end);
    } else {
      console.log("⏸️ Skipping fetch (initial load)");
    }
  }, [isInitialLoad]);

  // Fetch booking entries from Business Central API based on date range
  const fetchBookingEntries = async (startDate: Date, endDate: Date) => {
    try {
      console.log("🔄 Starting fetchBookingEntries:", { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(), 
        branchCode 
      });
      
      setLoading(true);
      setError(null);

      // Format dates as MM/DD/YYYY for Business Central API
      const formatDateForAPI = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const requestBody = {
        _BookingSetupCode: branchCode,
        _DateFrom: formatDateForAPI(startDate),
        _DateTo: formatDateForAPI(endDate)
      };

      console.log("📤 Making API request to /api/booking-entry/get-booking-entries with body:", requestBody);

      const response = await fetch('/api/booking-entry/get-booking-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        throw new Error(`Failed to fetch booking entries: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Received booking entries data", data);
      
      // Transform the API response to FullCalendar events
      const transformedEvents = transformBookingEntriesToEvents(data);
      console.log("🔄 Transformed events count:", transformedEvents.length);
      setEvents(transformedEvents);
      
    } catch (err) {
      console.error('❌ Error fetching booking entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      console.log("🏁 Fetch completed, setting loading to false");
      setLoading(false);
    }
  };

  // Transform Business Central booking entries to FullCalendar events
  const transformBookingEntriesToEvents = (apiResponse: any): CalendarEvent[] => {
    console.log("🔄 Transforming booking entries to events");
    
    if (!apiResponse.value) {
      console.log("❌ No value in API response");
      return [];
    }

    if (typeof apiResponse.value !== 'string') {
      console.log("❌ API response value is not a string:", typeof apiResponse.value);
      return [];
    }

    try {
      const entries: BookingEntry[] = JSON.parse(apiResponse.value);
      console.log("📊 Parsed entries count:", entries.length);

      return entries.map((entry: BookingEntry) => {
        const staffColor = getStaffColor(entry.StaffCode);

        // Combine date and time for FullCalendar
        const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;

        // Fix: If BookingEndDate is 0001-01-01 or empty, use BookingStartDate instead
        const endDate =
          entry.BookingEndDate && entry.BookingEndDate !== "0001-01-01"
            ? entry.BookingEndDate
            : entry.BookingStartDate;

        const endDateTime = `${endDate}T${entry.BookingEndTime || entry.BookingStartTime}`;

        return {
          id: entry.EntryNo.toString(),
          title: entry.BookingNote || `Appointment #${entry.EntryNo}`,
          start: startDateTime,
          end: endDateTime,
          color: staffColor.background,
          textColor: staffColor.text,
          extendedProps: {
            description: entry.BookingNote,
            location: entry.Address2 || '-',
            staff: entry.StaffName || entry.StaffCode,
            staffCode: entry.StaffCode,
            service: entry.ServiceName || '-',
            customer: entry.Name2 || entry.Name || entry.CustomerNo,
            status: entry.BookingStatus,
            branch: entry.BookingSetupCode,
            room: entry.Address2 || 'Main Room',
            rawData: entry
          }
        };
      });
    } catch (error) {
      console.error('❌ Error parsing booking entries:', error);
      return [];
    }
  };

  // Add a manual test button for debugging
  const testFetch = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    console.log("🧪 Manual test fetch triggered");
    fetchBookingEntries(firstDay, lastDay);
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Start editing a staff color
  const startEditingColor = (staffCode: string) => {
    setStaffColors(prev => prev.map(staff => 
      staff.code === staffCode 
        ? { ...staff, isEditing: true, tempColor: staff.color.background }
        : staff
    ));
  };

  // Cancel editing a staff color
  const cancelEditingColor = (staffCode: string) => {
    setStaffColors(prev => prev.map(staff => 
      staff.code === staffCode 
        ? { ...staff, isEditing: false, tempColor: undefined }
        : staff
    ));
  };

  // Update temporary color
  const updateTempColor = (staffCode: string, color: string) => {
    setStaffColors(prev => prev.map(staff => 
      staff.code === staffCode 
        ? { ...staff, tempColor: color }
        : staff
    ));
  };

  // Save staff color
  const saveStaffColor = async (staffCode: string, color: string) => {
    try {
      setUpdatingColor(staffCode);
      
      const response = await fetch('/api/booking-staff-auth/update-booking-staff-auth-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _BookingSetupCode: branchCode,
          _BookingParameterId: "STAFF_COLOR",
          _BookingParameterValueId: staffCode,
          _StaffColor: color
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff color');
      }

      // Update local state
      setStaffColors(prev => prev.map(staff => 
        staff.code === staffCode 
          ? { 
              ...staff, 
              isEditing: false, 
              tempColor: undefined,
              color: { 
                background: color, 
                text: getContrastColor(color) 
              } 
            }
          : staff
      ));

      // Refresh events to update colors in calendar
      if (currentDateRange) {
        await fetchBookingEntries(currentDateRange.start, currentDateRange.end);
      }

    } catch (error) {
      console.error('Error updating staff color:', error);
      alert('Failed to update staff color');
    } finally {
      setUpdatingColor(null);
    }
  };

  // Helper function to determine text color based on background brightness
  function getContrastColor(hexColor: string): string {
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  if (loading && events.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Staff Colors Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Staff Colors
          </CardTitle>
          <CardDescription>
            Manage staff colors for calendar events.
            {currentDateRange && (
              <> - Showing appointments from {currentDateRange.start.toLocaleDateString()} to {currentDateRange.end.toLocaleDateString()}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffColors.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No staff found in the current date range</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffColors.map((staff) => (
                <div key={staff.code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ 
                        backgroundColor: staff.isEditing ? staff.tempColor : staff.color.background,
                        borderColor: staff.isEditing ? staff.tempColor : staff.color.background
                      }}
                    />
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {staff.code}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {staff.isEditing ? (
                      <>
                        <Input
                          type="color"
                          value={staff.tempColor || staff.color.background}
                          onChange={(e) => updateTempColor(staff.code, e.target.value)}
                          className="w-20 h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveStaffColor(staff.code, staff.tempColor || staff.color.background)}
                          disabled={updatingColor === staff.code}
                        >
                          {updatingColor === staff.code ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEditingColor(staff.code)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingColor(staff.code)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Container */}
      <Card>
        <CardContent className="p-6 relative">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            navLinks={true}
            editable={false}
            selectable={false}
            dayMaxEvents={3}
            weekends={true}
            nowIndicator={true}
            displayEventTime={true}
            displayEventEnd={true}
            views={{
              dayGridMonth: {
                dayMaxEvents: 3
              },
              timeGrid: {
                slotMinTime: '06:00:00',
                slotMaxTime: '22:00:00',
                allDaySlot: true
              }
            }}
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              list: 'List'
            }}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
          {/* Show loading overlay only when actually loading new data */}
          {loading && events.length > 0 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Loading appointments...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Booking details</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="text-sm">
                      {new Date(selectedEvent.start).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Time</p>
                    <p className="text-sm">
                      {new Date(selectedEvent.start).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(selectedEvent.end).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Staff & Service */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Staff</p>
                    <p className="text-sm">{selectedEvent.extendedProps.staff}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Service</p>
                    <p className="text-sm">{selectedEvent.extendedProps.service}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer & Location */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="text-sm">{selectedEvent.extendedProps.customer}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Branch</p>
                    <p className="text-sm">{selectedEvent.extendedProps.branch}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-sm">{selectedEvent.extendedProps.location}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                  <Badge variant="secondary" className="capitalize">
                    {selectedEvent.extendedProps.status}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.extendedProps.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeModal} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}