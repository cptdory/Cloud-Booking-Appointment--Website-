"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Calendar, Clock, User, Briefcase, MapPin, Building2, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BookingEntry {
  EntryNo: number;
  BookingStartDate: string;
  BookingEndDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingNote: string;
  BookingStatus: string;
  BookingSetupCode: string;
  ServiceType: string;
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

// Hardcoded staff colors with good text contrast
const STAFF_COLORS: { [key: string]: { background: string; text: string } } = {
  "S1": { background: "#3788d8", text: "#ffffff" },
  "S2": { background: "#10b981", text: "#ffffff" },
  "S3": { background: "#8b5cf6", text: "#ffffff" },
  "S4": { background: "#f59e0b", text: "#000000" },
  "default": { background: "#6b7280", text: "#ffffff" }
};

export default function BookingCalendar() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Check if user is admin and fetch bookings
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    // Initial fetch with current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    fetchBookingEntries(firstDay, lastDay);
  }, [router]);

  // Handle calendar date range changes
  const handleDatesSet = (dateInfo: DatesSetArg) => {
    setCurrentDateRange({
      start: dateInfo.start,
      end: dateInfo.end
    });
    fetchBookingEntries(dateInfo.start, dateInfo.end);
  };

  // Get color for staff member with good contrast
  const getStaffColor = (staffCode: string, staffName: string): { background: string; text: string } => {
    // Try staff code first
    if (staffCode && STAFF_COLORS[staffCode.toUpperCase()]) {
      return STAFF_COLORS[staffCode.toUpperCase()];
    }
    
    // Try staff name
    if (staffName && STAFF_COLORS[staffName.toUpperCase()]) {
      return STAFF_COLORS[staffName.toUpperCase()];
    }
    
    // Fallback: generate consistent color based on staff code/name
    const staffKey = staffCode || staffName || "default";
    const colorOptions = [
      { background: "#3788d8", text: "#ffffff" },
      { background: "#10b981", text: "#ffffff" },
      { background: "#8b5cf6", text: "#ffffff" },
      { background: "#f59e0b", text: "#000000" },
      { background: "#ef4444", text: "#ffffff" },
      { background: "#06b6d4", text: "#000000" },
      { background: "#84cc16", text: "#000000" },
      { background: "#f97316", text: "#000000" },
      { background: "#ec4899", text: "#ffffff" },
      { background: "#14b8a6", text: "#000000" }
    ];
    
    let hash = 0;
    for (let i = 0; i < staffKey.length; i++) {
      hash = staffKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  // Fetch booking entries from Business Central API based on date range
  const fetchBookingEntries = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      // Format dates as MM/DD/YYYY for Business Central API
      const formatDateForAPI = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const response = await fetch('/api/booking/get-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _BookingSetupCode: "MAIN",
          _DateFrom: formatDateForAPI(startDate),
          _DateTo: formatDateForAPI(endDate)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch booking entries: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to FullCalendar events
      const transformedEvents = transformBookingEntriesToEvents(data);
      setEvents(transformedEvents);
      
    } catch (err) {
      console.error('Error fetching booking entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Transform Business Central booking entries to FullCalendar events
  const transformBookingEntriesToEvents = (apiResponse: any): CalendarEvent[] => {
    if (!apiResponse.value || typeof apiResponse.value !== 'string') {
      return [];
    }

    try {
const entries: BookingEntry[] = JSON.parse(apiResponse.value);

return entries.map((entry: BookingEntry) => {
  const staffColor = getStaffColor(entry.StaffCode, entry.StaffName);

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
            service: entry.ServiceType || '-',
            customer: entry.Name2 || entry.Name || entry.CustomerNo,
            status: entry.BookingStatus,
            branch: entry.BookingSetupCode,
            room: entry.Address2 || 'Main Room',
            rawData: entry
          }
        };
      });
    } catch (error) {
      console.error('Error parsing booking entries:', error);
      return [];
    }
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

      {/* Staff Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Colors</CardTitle>
          <CardDescription>
            {currentDateRange && (
              <>Showing appointments from {currentDateRange.start.toLocaleDateString()} to {currentDateRange.end.toLocaleDateString()}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STAFF_COLORS).map(([staffCode, colors]) => (
              <Badge 
                key={staffCode} 
                variant="outline" 
                className="px-3 py-1.5"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: colors.background }}
                />
                {staffCode}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Container */}
      <Card>
        <CardContent className="p-6">
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
            datesSet={handleDatesSet} // This is the key addition
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
            loading={(isLoading) => {
              // Show loading indicator when fetching new data
              if (isLoading && events.length > 0) {
                setLoading(true);
              }
            }}
          />
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