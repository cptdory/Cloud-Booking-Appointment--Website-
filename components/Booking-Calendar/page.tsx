"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  MapPin,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
  background: string;
  text: string;
}

export default function BookingCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Staff color states
  const [staffColors, setStaffColors] = useState<{ [key: string]: StaffColor }>({});

  const branchCode = searchParams.get("code") || "MAIN";

  // Load staff colors
  const loadStaffColors = async (staffCodes: string[]) => {
    if (staffCodes.length === 0) return;

    try {
      const body = {
        _BookingParameterValueIds: staffCodes,
        _BookingSetupCode: branchCode,
      };

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (res.ok && data.staffColors) {
        setStaffColors(data.staffColors);
      }
    } catch (error) {
      console.error("Failed to load staff colors:", error);
    }
  };

  // Get contrast color for text
  function getContrastColor(hexColor: string): string {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  // Auth and initial load
  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (!authData.authenticated) {
          router.replace("/signin");
          return;
        }

        // Load current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        await fetchBookingEntries(firstDay, lastDay);
      } catch (error) {
        console.error("Initialization failed:", error);
        router.replace("/signin");
      }
    };

    init();
  }, [router, branchCode]);

  // Handle date changes
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setCurrentDateRange({ start: dateInfo.start, end: dateInfo.end });
    fetchBookingEntries(dateInfo.start, dateInfo.end);
  }, []);

  // Fetch booking entries
  const fetchBookingEntries = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      const formatDate = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const requestBody = {
        _BookingSetupCode: branchCode,
        _DateFrom: formatDate(startDate),
        _DateTo: formatDate(endDate),
      };

      const response = await fetch("/api/booking-entry/get-booking-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      await transformAndSetEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Transform data to events
  const transformAndSetEvents = async (apiResponse: any) => {
    if (!apiResponse.value || typeof apiResponse.value !== "string") {
      setEvents([]);
      return;
    }

    try {
      const entries: BookingEntry[] = JSON.parse(apiResponse.value);
      
      // Get unique staff codes and load their colors
      const uniqueStaffCodes = [...new Set(entries.map(entry => entry.StaffCode))].filter(Boolean);
      await loadStaffColors(uniqueStaffCodes);

      // Create events with colors
      const events = entries.map((entry: BookingEntry) => {
        const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
        const endDate = entry.BookingEndDate && entry.BookingEndDate !== "0001-01-01"
          ? entry.BookingEndDate
          : entry.BookingStartDate;
        const endDateTime = `${endDate}T${entry.BookingEndTime || entry.BookingStartTime}`;

        const staffColor = staffColors[entry.StaffCode] || {
          background: "#6b7280",
          text: "#ffffff"
        };

        return {
          id: entry.EntryNo.toString(),
          title: entry.StaffName,
          start: startDateTime,
          end: endDateTime,
          color: staffColor.background,
          textColor: staffColor.text,
          extendedProps: {
            description: entry.BookingNote,
            location: entry.Address2 || "-",
            staff: entry.StaffName || entry.StaffCode,
            staffCode: entry.StaffCode,
            service: entry.ServiceName || "-",
            customer: entry.Name2 || entry.Name || entry.CustomerNo,
            status: entry.BookingStatus,
            branch: entry.BookingSetupCode,
            room: entry.Address2,
            rawData: entry,
          },
        };
      });

      setEvents(events);
    } catch (error) {
      console.error("Error transforming events:", error);
      setEvents([]);
    }
  };

  // Event click handler
  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
    setIsModalOpen(true);
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
          <CardDescription>View and manage appointments</CardDescription>
        </CardHeader>
        <CardContent className="p-6 relative">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            editable={false}
            selectable={false}
            dayMaxEvents={3}
            weekends={true}
            nowIndicator={true}
          />
          {loading && events.length > 0 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Booking details</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm">
                      {new Date(selectedEvent.start).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm">
                      {new Date(selectedEvent.start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - {new Date(selectedEvent.end).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Staff</p>
                    <p className="text-sm">{selectedEvent.extendedProps.staff}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Service</p>
                    <p className="text-sm">{selectedEvent.extendedProps.service}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <Badge variant="secondary" className="capitalize">
                  {selectedEvent.extendedProps.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}