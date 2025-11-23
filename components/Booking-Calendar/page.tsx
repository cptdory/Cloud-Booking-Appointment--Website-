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

  const [staffColors, setStaffColors] = useState<{ [key: string]: StaffColor }>({});
  const [bookingParameterId, setBookingParameterId] = useState<string>("");
  const [staffMappings, setStaffMappings] = useState<StaffMapping>({});
  const [bookingEntries, setBookingEntries] = useState<BookingEntry[]>([]);

  const branchCode = searchParams.get("code") || "MAIN";

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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedEvent?.title}</span>
              {selectedEvent && (
                <Badge 
                  variant={
                    selectedEvent.extendedProps.status === "Active" 
                      ? "default" 
                      : selectedEvent.extendedProps.status === "Finalized"
                      ? "secondary"
                      : "destructive"
                  }
                  className="capitalize"
                >
                  {selectedEvent.extendedProps.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Booking #{selectedEvent?.id} - {selectedEvent?.extendedProps.branch}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-5 py-4">
              {/* Status Update Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Update Status
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Active" ? "default" : "outline"}
                    onClick={() => handleStatusChange("Active")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Active"}
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Active" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Finalized" ? "default" : "outline"}
                    onClick={() => handleStatusChange("Finalized")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Finalized"}
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Finalized" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Finalized
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEvent.extendedProps.status === "Cancelled" ? "destructive" : "outline"}
                    onClick={() => handleStatusChange("Cancelled")}
                    disabled={isUpdatingStatus || selectedEvent.extendedProps.status === "Cancelled"}
                  >
                    {isUpdatingStatus && selectedEvent.extendedProps.status !== "Cancelled" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Cancelled
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Date & Time Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Schedule
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">
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
                    <div className="flex-1">
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Service Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Service</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.extendedProps.service}
                        {selectedEvent.extendedProps.rawData?.ServiceCode && 
                          ` (${selectedEvent.extendedProps.rawData.ServiceCode})`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Staff Member</p>
                      <p className="text-sm text-muted-foreground">
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Customer</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.extendedProps.customer || "Not specified"}
                        {selectedEvent.extendedProps.rawData?.CustomerNo && 
                          ` (${selectedEvent.extendedProps.rawData.CustomerNo})`
                        }
                      </p>
                    </div>
                  </div>

                  {selectedEvent.extendedProps.rawData?.PhoneNo && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                        <span className="text-sm text-muted-foreground">📞</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.extendedProps.rawData.PhoneNo}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.EMail && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                        <span className="text-sm text-muted-foreground">✉️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.extendedProps.rawData.EMail}
                        </p>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.extendedProps.rawData?.Age ?? 0) > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                        <span className="text-sm text-muted-foreground">🎂</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Age</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.extendedProps.rawData?.Age} years old
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.Address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
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
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Notes
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      ⏰ Time Off
                    </Badge>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}