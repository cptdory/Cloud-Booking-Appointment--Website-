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
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
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
  ServiceType: string;
  ServiceCode: string;
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

interface StaffMapping {
  [staffCode: string]: number;
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [calendarView, setCalendarView] = useState<string>("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>("");

  const [staffColors, setStaffColors] = useState<{ [key: string]: StaffColor }>({});
  const [bookingParameterId, setBookingParameterId] = useState<string>("");
  const [staffMappings, setStaffMappings] = useState<StaffMapping>({});
  const [bookingEntries, setBookingEntries] = useState<BookingEntry[]>([]);

  const branchCode = searchParams.get("code") || "MAIN";

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load staff mappings (StaffCode -> BookingParameterValueId)
  const loadStaffMappings = async (): Promise<{ mappings: StaffMapping; parameterId: string }> => {
    try {
      const res = await fetch(
        `/api/booking-setup/get-booking-setup?code=${branchCode}`
      );
      const json = await res.json();

      if (json.value && json.value.length > 0) {
        const setup = json.value[0];
        
        const staffParam = setup.BookingParameter?.find(
          (p: any) => p.BookingParameterStaff === true
        );

        if (staffParam) {
          const parameterId = staffParam.BookingParameterId.toString();
          console.log("✅ Found staff parameter:", parameterId);
          setBookingParameterId(parameterId);
          
          const mappings: StaffMapping = {};
          staffParam.BookingParameterValue?.forEach((value: any) => {
            mappings[value.BookingParameterValueCode] = value.BookingParameterValueId;
          });
          
          console.log("🗺️ Staff mappings:", mappings);
          setStaffMappings(mappings);
          return { mappings, parameterId };
        }
      }
      console.warn("⚠️ No staff parameter found");
      return { mappings: {}, parameterId: "" };
    } catch (error) {
      console.error("❌ Failed to fetch staff mappings:", error);
      return { mappings: {}, parameterId: "" };
    }
  };

  // Load staff colors - USING ARRAY FORMAT
  const loadStaffColors = async (
    staffCodes: string[], 
    mappings: StaffMapping, 
    parameterId: string
  ): Promise<{ [key: string]: StaffColor }> => {
    if (staffCodes.length === 0 || !parameterId) return {};

    try {
      // Convert StaffCodes to BookingParameterValueIds
      const parameterValueIds = staffCodes
        .map(code => mappings[code])
        .filter(id => id !== undefined)
        .map(id => id.toString());

      if (parameterValueIds.length === 0) {
        console.warn("⚠️ No valid staff mappings found for codes:", staffCodes);
        return {};
      }

      const body = {
        _BookingParameterValueIds: parameterValueIds,
        _BookingSetupCode: branchCode,
        _BookingParameterId: parameterId,
      };

      console.log("🎨 Loading staff colors with ARRAY body:", body);

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (res.ok && data.staffColors) {
        console.log("✅ Staff colors response:", data.staffColors);
        
        // Convert back from BookingParameterValueId to StaffCode
        const convertedColors: { [key: string]: StaffColor } = {};
        
        Object.keys(data.staffColors).forEach(parameterValueId => {
          const staffCode = Object.keys(mappings).find(
            code => mappings[code].toString() === parameterValueId
          );
          
          if (staffCode) {
            convertedColors[staffCode] = data.staffColors[parameterValueId];
            console.log(`🎨 Mapped color: ${staffCode} (ID: ${parameterValueId}) -> ${data.staffColors[parameterValueId].background}`);
          }
        });
        
        console.log("🔄 Final converted colors:", convertedColors);
        return convertedColors;
      } else {
        console.warn("⚠️ Failed to load staff colors:", data.error);
        return {};
      }
    } catch (error) {
      console.error("❌ Failed to load staff colors:", error);
      return {};
    }
  };

  // Get contrast color for text
  function getContrastColor(hexColor: string): string {
    if (!hexColor) return "#ffffff";
    const hex = hexColor.replace("#", "");
    if (hex.length !== 6) return "#ffffff";
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  // Get staff color with fallback to gray
  const getStaffColor = (staffCode: string): StaffColor => {
    const color = staffColors[staffCode];
    if (color && color.background) {
      return color;
    }
    // Fallback to gray
    return {
      background: "#6b7280",
      text: "#ffffff"
    };
  };

  // Create events from booking entries with current staff colors
  const createEvents = useCallback((entries: BookingEntry[]): CalendarEvent[] => {
    return entries.map((entry: BookingEntry) => {
      const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
      const endDate = entry.BookingEndDate && entry.BookingEndDate !== "0001-01-01"
        ? entry.BookingEndDate
        : entry.BookingStartDate;
      const endDateTime = `${endDate}T${entry.BookingEndTime || entry.BookingStartTime}`;

      const staffColor = getStaffColor(entry.StaffCode);

      console.log(`🎨 Creating event for ${entry.StaffCode}:`, staffColor);

      return {
        id: entry.EntryNo.toString(),
        title: entry.StaffName || entry.StaffCode,
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
  }, [staffColors]);

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

        const { mappings, parameterId } = await loadStaffMappings();
        
        if (Object.keys(mappings).length > 0 && parameterId) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          await fetchBookingEntries(firstDay, lastDay, mappings, parameterId);
        } else {
          setError("Could not load calendar configuration");
          setLoading(false);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        router.replace("/signin");
      }
    };

    init();
  }, [router, branchCode]);

  // Update events when staffColors change
  useEffect(() => {
    if (bookingEntries.length > 0) {
      console.log("🔄 Updating events with new staff colors:", staffColors);
      const newEvents = createEvents(bookingEntries);
      setEvents(newEvents);
    }
  }, [staffColors, bookingEntries, createEvents]);

  // Handle date changes
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setCurrentDateRange({ start: dateInfo.start, end: dateInfo.end });
    setCurrentTitle(dateInfo.view.title);
    // Use current state values
    if (bookingParameterId && Object.keys(staffMappings).length > 0) {
      fetchBookingEntries(dateInfo.start, dateInfo.end, staffMappings, bookingParameterId);
    }
  }, [bookingParameterId, staffMappings]);

  // Fetch booking entries
  const fetchBookingEntries = async (
    startDate: Date, 
    endDate: Date, 
    mappings: StaffMapping, 
    parameterId: string
  ) => {
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
      await transformAndSetEvents(data, mappings, parameterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Transform data to events
  const transformAndSetEvents = async (apiResponse: any, mappings: StaffMapping, parameterId: string) => {
    if (!apiResponse.value || typeof apiResponse.value !== "string") {
      setEvents([]);
      setBookingEntries([]);
      return;
    }

    try {
      const entries: BookingEntry[] = JSON.parse(apiResponse.value);
      setBookingEntries(entries); // Store the raw entries
      
      // Get unique staff codes
      const uniqueStaffCodes = [...new Set(entries.map(entry => entry.StaffCode))].filter(Boolean);
      
      console.log("👥 Unique staff codes found:", uniqueStaffCodes);
      
      if (uniqueStaffCodes.length > 0 && parameterId && Object.keys(mappings).length > 0) {
        console.log("🎨 Loading colors for staff codes:", uniqueStaffCodes);
        const loadedColors = await loadStaffColors(uniqueStaffCodes, mappings, parameterId);
        
        // Update staff colors state
        setStaffColors(prev => ({
          ...prev,
          ...loadedColors
        }));
        
        // Create initial events with loaded colors
        const initialEvents = entries.map((entry: BookingEntry) => {
          const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
          const endDate = entry.BookingEndDate && entry.BookingEndDate !== "0001-01-01"
            ? entry.BookingEndDate
            : entry.BookingStartDate;
          const endDateTime = `${endDate}T${entry.BookingEndTime || entry.BookingStartTime}`;

          const staffColor = loadedColors[entry.StaffCode] || {
            background: "#6b7280",
            text: "#ffffff"
          };

          console.log(`🎨 Initial event for ${entry.StaffCode}:`, staffColor);

          return {
            id: entry.EntryNo.toString(),
            title: entry.StaffName || entry.StaffCode,
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

        setEvents(initialEvents);
      } else {
        console.warn("⚠️ Cannot load colors - missing required data:", {
          hasStaffCodes: uniqueStaffCodes.length > 0,
          hasParameterId: !!parameterId,
          hasMappings: Object.keys(mappings).length > 0
        });
        
        // Create events with default gray colors
        const defaultEvents = createEvents(entries);
        setEvents(defaultEvents);
      }
    } catch (error) {
      console.error("Error transforming events:", error);
      setEvents([]);
      setBookingEntries([]);
    }
  };

  // Event click handler
  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
    setIsModalOpen(true);
  };

  // Update booking status
  const updateBookingStatus = async (entryNo: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      setError(null);

      const response = await fetch("/api/booking-entry/update-booking-entry-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _EntryNo: entryNo,
          _BookingStatus: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update booking status");
      }

      const data = await response.json();
      console.log("✅ Status updated successfully:", data);

      // Update the event in the local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === entryNo
            ? {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  status: newStatus,
                  rawData: event.extendedProps.rawData
                    ? { ...event.extendedProps.rawData, BookingStatus: newStatus }
                    : undefined,
                },
              }
            : event
        )
      );

      // Update selected event
      if (selectedEvent && selectedEvent.id === entryNo) {
        setSelectedEvent({
          ...selectedEvent,
          extendedProps: {
            ...selectedEvent.extendedProps,
            status: newStatus,
            rawData: selectedEvent.extendedProps.rawData
              ? { ...selectedEvent.extendedProps.rawData, BookingStatus: newStatus }
              : undefined,
          },
        });
      }

      // Refresh booking entries to get latest data
      if (currentDateRange) {
        await fetchBookingEntries(
          currentDateRange.start,
          currentDateRange.end,
          staffMappings,
          bookingParameterId
        );
      }

      return true;
    } catch (err) {
      console.error("❌ Failed to update booking status:", err);
      setError(err instanceof Error ? err.message : "Failed to update booking status");
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;
    
    const success = await updateBookingStatus(selectedEvent.id, newStatus);
    if (success) {
      // Optionally close the modal after successful update
      // setIsModalOpen(false);
    }
  };

  // Handle view change
  const handleViewChange = (view: string) => {
    setCalendarView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
      setCurrentTitle(calendarApi.view.title);
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-16 md:py-20">
            <div className="text-center space-y-5">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-sm"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">Loading Calendar</p>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Preparing your schedule and staff...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {error && (
        <Alert variant="destructive" className="border-l-4 border-l-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb- border-b">
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and View Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold bg-clip-text">
                  Booking Calendar
                </CardTitle>
                <CardDescription className="text-base">
                  View and manage appointments for {branchCode}
                </CardDescription>
              </div>
              
              {/* View Controls */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex rounded-lg p-1">
                  <Button
                    variant={calendarView === "dayGridMonth" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewChange("dayGridMonth")}
                    className="text-xs h-8 px-3"
                  >
                    Month
                  </Button>
                  <Button
                    variant={calendarView === "timeGridWeek" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewChange("timeGridWeek")}
                    className="text-xs h-8 px-3"
                  >
                    Week
                  </Button>
                  <Button
                    variant={calendarView === "timeGridDay" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewChange("timeGridDay")}
                    className="text-xs h-8 px-3"
                  >
                    Day
                  </Button>
                  <Button
                    variant={calendarView === "listWeek" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewChange("listWeek")}
                    className="text-xs h-8 px-3"
                  >
                    List
                  </Button>
                </div>
                
                {/* Mobile view indicator */}
                <div className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1.5 rounded-lg border">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile View</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Navigation and Current Period */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-9 px-4 font-medium"
                >
                  Today
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="h-9 px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Current Period Title */}
              <div className="text-center sm:text-right">
                <h3 className="text-lg font-semibold px-4 py-2 rounded-lg border">
                  {currentTitle}
                </h3>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 relative">
          <div className="rounded-xl overflow-hidden border shadow-sm">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              headerToolbar={false} // We're using custom header
              initialView={isMobile ? "listWeek" : "dayGridMonth"}
              events={events}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
              editable={false}
              selectable={false}
              dayMaxEvents={isMobile ? 1 : 3}
              weekends={true}
              nowIndicator={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }}
              // Mobile optimizations
              eventDisplay={isMobile ? 'list-item' : 'auto'}
              dayHeaderFormat={isMobile ? { weekday: 'short' } : { weekday: 'long' }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
            />
          </div>
          
          {loading && events.length > 0 && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <div className="bg-white/90 border rounded-xl p-4 shadow-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Updating calendar...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 py-5 border-b">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-xl">
              <span className="truncate">{selectedEvent?.title}</span>
              {selectedEvent && (
                <Badge 
                  variant={
                    selectedEvent.extendedProps.status === "Active" 
                      ? "default" 
                      : selectedEvent.extendedProps.status === "Finalized"
                      ? "secondary"
                      : "destructive"
                  }
                  className="capitalize shrink-0 text-xs px-2 py-1"
                >
                  {selectedEvent.extendedProps.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              Booking #{selectedEvent?.id} • {selectedEvent?.extendedProps.branch}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6 py-5 px-6">
              {/* Status Update Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Update Status
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Active" ? "default" : "outline"}
                    onClick={() => handleStatusChange("Active")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Active"}
                    className="flex-1 sm:flex-none min-w-[90px]"
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Active" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : null}
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Finalized" ? "default" : "outline"}
                    onClick={() => handleStatusChange("Finalized")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Finalized"}
                    className="flex-1 sm:flex-none min-w-[90px]"
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Finalized" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : null}
                    Finalized
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Cancelled" ? "destructive" : "outline"}
                    onClick={() => handleStatusChange("Cancelled")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Cancelled"}
                    className="flex-1 sm:flex-none min-w-[90px]"
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Cancelled" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    ) : null}
                    Cancelled
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Date & Time Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Schedule
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Date</p>
                      <p className="text-sm truncate">
                        {new Date(selectedEvent.start).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Time</p>
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
              </div>

              <Separator />

              {/* Service & Staff Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Service Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Service</p>
                      <p className="text-sm truncate">
                        {selectedEvent.extendedProps.service}
                        {selectedEvent.extendedProps.rawData?.ServiceCode && 
                          ` (${selectedEvent.extendedProps.rawData.ServiceCode})`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Staff Member</p>
                      <p className="text-sm truncate">
                        {selectedEvent.extendedProps.staff}
                        {selectedEvent.extendedProps.staffCode && 
                          ` (${selectedEvent.extendedProps.staffCode})`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Customer</p>
                      <p className="text-sm truncate">
                        {selectedEvent.extendedProps.customer || "Not specified"}
                        {selectedEvent.extendedProps.rawData?.CustomerNo && 
                          ` (${selectedEvent.extendedProps.rawData.CustomerNo})`
                        }
                      </p>
                    </div>
                  </div>

                  {selectedEvent.extendedProps.rawData?.PhoneNo && (
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-sm">📞</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Phone</p>
                        <p className="text-sm">
                          {selectedEvent.extendedProps.rawData.PhoneNo}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.EMail && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-sm">✉️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Email</p>
                        <p className="text-sm truncate">
                          {selectedEvent.extendedProps.rawData.EMail}
                        </p>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.extendedProps.rawData?.Age ?? 0) > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-sm">🎂</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Age</p>
                        <p className="text-sm">
                          {selectedEvent.extendedProps.rawData?.Age} years old
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.Address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                      <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Address</p>
                        <p className="text-sm">
                          {selectedEvent.extendedProps.rawData.Address}
                          {selectedEvent.extendedProps.rawData.Address2 && 
                            `, ${selectedEvent.extendedProps.rawData.Address2}`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {selectedEvent.extendedProps.description && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                      Notes
                    </h3>
                    <div className="rounded-xl p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedEvent.extendedProps.description}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Time Off Badge */}
              {selectedEvent.extendedProps.rawData?.TimeOff && (
                <>
                  <Separator />
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className="py-2 px-4 text-sm">
                      ⏰ Time Off Period
                    </Badge>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}