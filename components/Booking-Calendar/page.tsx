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
import { cn } from "@/lib/utils";
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
  Phone,
  Mail,
  Cake,
  AlertCircle,
  Loader2,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookingEntry } from "@/types/bookingEntry";
import { CalendarEvent } from "@/types/calendarEvent";
import StaffTimeOffDialog from "@/components/Staff-Timeoff/StaffTimeOffDialog";

// Import hooks
import { useAuth } from "@/hooks/useAuth";
import { useAlert } from "@/hooks/useAlert";
import { useStaffColors } from "@/hooks/useStaffColors";
import { useStaffMappings } from "@/hooks/useStaffMappings";
import { useBookingEntries } from "@/hooks/useBookingEntries";

interface StaffColor {
  background: string;
  text: string;
}

export default function BookingCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);

  // Use hooks
  const { userRole, username, customerNo, checkingAuth } = useAuth();
  const { alert, showAlert } = useAlert();
  const { staffColors, loadStaffColors, getStaffColor } = useStaffColors();
  const { staffMappings, bookingParameterId, loadStaffMappings } =
    useStaffMappings();
  const {
    bookingEntries,
    loading: entriesLoading,
    error: entriesError,
    fetchBookingEntries,
    updateBookingStatus,
  } = useBookingEntries();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [calendarView, setCalendarView] = useState<string>("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);

  const branchCode = searchParams.get("code") || "MAIN";

  // Check for mobile device and set initial view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile && calendarView !== "listWeek") {
        setCalendarView("listWeek");
        if (calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.changeView("listWeek");
          setCurrentTitle(calendarApi.view.title);
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [calendarView]);

  // Create events from booking entries with current staff colors
  const createEvents = useCallback(
    (entries: BookingEntry[]): CalendarEvent[] => {
      return entries.map((entry: BookingEntry) => {
        const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
        const endDate =
          entry.BookingEndDate && entry.BookingEndDate !== "0001-01-01"
            ? entry.BookingEndDate
            : entry.BookingStartDate;
        const endDateTime = `${endDate}T${
          entry.BookingEndTime || entry.BookingStartTime
        }`;

        const staffColor = getStaffColor(entry.StaffCode);
        
        // Determine event title based on TimeOff flag
        // For non-time-off: include service name with staff name
        let eventTitle = "";
        if (entry.TimeOff) {
          eventTitle = "Time Off";
        } else {
          const serviceName = entry.ServiceName || "-";
          const staffName = entry.StaffName || entry.StaffCode;
          eventTitle = `${serviceName} - ${staffName}`;
        }

        return {
          id: entry.EntryNo.toString(),
          title: eventTitle,
          start: startDateTime,
          end: endDateTime,
          color: staffColor.background,
          textColor: staffColor.text,
          extendedProps: {
            description: entry.BookingNote,
            location: entry.Address2 || "-",
            staff: entry.StaffName || entry.StaffCode,
            staffCode: entry.StaffCode,
            staffName: entry.StaffName,
            service: entry.ServiceName || "-",
            customer: entry.Name2 || entry.Name || entry.CustomerNo,
            status: entry.BookingStatus,
            branch: entry.BookingSetupCode,
            room: entry.Address2,
            rawData: entry,
          },
        };
      });
    },
    [getStaffColor]
  );

  // Update events when booking entries change
  useEffect(() => {
    if (bookingEntries.length > 0) {
      const newEvents = createEvents(bookingEntries);
      setEvents(newEvents);
    }
  }, [bookingEntries, createEvents]);

  // Auth check and initial load
  useEffect(() => {
    const initCalendar = async () => {
      if (checkingAuth) return;

      try {
        setInitialLoading(true);

        // Load staff mappings first
        const { mappings, parameterId } = await loadStaffMappings(branchCode);

        if (Object.keys(mappings).length > 0 && parameterId) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          // Fetch booking entries
          const entries = await fetchBookingEntries(
            branchCode,
            firstDay,
            lastDay
          );

          // Load staff colors for the entries
          const uniqueStaffCodes = [
            ...new Set(entries.map((entry) => entry.StaffCode)),
          ].filter(Boolean);
          if (uniqueStaffCodes.length > 0) {
            await loadStaffColors(
              uniqueStaffCodes,
              mappings,
              parameterId,
              branchCode
            );
          }
        } else {
          showAlert(
            "Configuration Error",
            "Could not load staff configuration for this branch.",
            "destructive"
          );
        }
      } catch (error: any) {
        console.error("Calendar initialization failed:", error);
        showAlert(
          "Initialization Failed",
          error.message || "Failed to load calendar data",
          "destructive"
        );
      } finally {
        setInitialLoading(false);
      }
    };

    initCalendar();
  }, [checkingAuth, branchCode]); // Removed problematic dependencies

  // Handle date changes
  const handleDatesSet = useCallback(
    async (dateInfo: DatesSetArg) => {
      setCurrentDateRange({ start: dateInfo.start, end: dateInfo.end });
      setCurrentTitle(dateInfo.view.title);

      if (bookingParameterId && Object.keys(staffMappings).length > 0) {
        try {
          const entries = await fetchBookingEntries(
            branchCode,
            dateInfo.start,
            dateInfo.end
          );

          // Load colors for new entries if needed
          const uniqueStaffCodes = [
            ...new Set(entries.map((entry) => entry.StaffCode)),
          ].filter(Boolean);
          const newStaffCodes = uniqueStaffCodes.filter(
            (code) => !staffColors[code]
          );

          if (newStaffCodes.length > 0) {
            await loadStaffColors(
              newStaffCodes,
              staffMappings,
              bookingParameterId,
              branchCode
            );
          }
        } catch (error: any) {
          showAlert(
            "Load Error",
            error.message || "Failed to load calendar data for selected period",
            "destructive"
          );
        }
      }
    },
    [
      bookingParameterId,
      staffMappings,
      branchCode,
      staffColors,
      fetchBookingEntries,
      loadStaffColors,
      showAlert,
    ]
  );

  // Event click handler
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
    setIsModalOpen(true);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selectedEvent) return;

      setIsUpdatingStatus(true);
      try {
        const success = await updateBookingStatus(selectedEvent.id, newStatus);
        if (success) {
          showAlert(
            "Status Updated",
            `Booking status changed to ${newStatus}`,
            "default"
          );

          // Update selected event locally
          setSelectedEvent((prev) =>
            prev
              ? {
                  ...prev,
                  extendedProps: {
                    ...prev.extendedProps,
                    status: newStatus,
                    rawData: prev.extendedProps.rawData
                      ? {
                          ...prev.extendedProps.rawData,
                          BookingStatus: newStatus,
                        }
                      : undefined,
                  },
                }
              : null
          );
        }
      } catch (error: any) {
        showAlert(
          "Update Failed",
          error.message || "Failed to update status",
          "destructive"
        );
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [selectedEvent, updateBookingStatus, showAlert]
  );

  // Handle view change - prevent non-list views on mobile
  const handleViewChange = useCallback(
    (view: string) => {
      if (isMobile && view !== "listWeek") {
        return;
      }
      setCalendarView(view);
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentTitle(calendarApi.view.title);
      }
    },
    [isMobile]
  );

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setCurrentTitle(calendarApi.view.title);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setCurrentTitle(calendarApi.view.title);
    }
  }, []);

  const handleToday = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setCurrentTitle(calendarApi.view.title);
    }
  }, []);

  // Get initial view based on device
  const getInitialView = useCallback(() => {
    return isMobile ? "listWeek" : calendarView;
  }, [isMobile, calendarView]);

  // Show loading while checking authentication or initial loading
  if (checkingAuth || initialLoading) {
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
                <p className="text-lg font-semibold text-foreground">
                  {checkingAuth
                    ? "Checking Authentication..."
                    : "Loading Calendar"}
                </p>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {checkingAuth
                    ? "Verifying your access..."
                    : "Preparing your schedule and staff..."}
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
      {/* Alert Component */}
      {alert.show && (
        <Alert
          variant={alert.variant}
          className="mb-6 animate-in slide-in-from-top duration-300 border-l-4 border-l-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {entriesError && (
        <Alert
          variant="destructive"
          className="border-l-4 border-l-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{entriesError}</AlertDescription>
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

              {/* View Controls + Time Off Button */}
              <div className="flex items-center gap-3">
                <StaffTimeOffDialog />

                <div className="hidden sm:flex rounded-lg p-1">
                  <Button
                    variant={
                      calendarView === "dayGridMonth" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleViewChange("dayGridMonth")}
                    className="text-xs h-8 px-3"
                  >
                    Month
                  </Button>
                  <Button
                    variant={
                      calendarView === "timeGridWeek" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleViewChange("timeGridWeek")}
                    className="text-xs h-8 px-3"
                  >
                    Week
                  </Button>
                  <Button
                    variant={
                      calendarView === "timeGridDay" ? "default" : "ghost"
                    }
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
                {isMobile && (
                  <div className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1.5 rounded-lg border">
                    <Smartphone className="w-4 h-4" />
                    <span>List View</span>
                  </div>
                )}
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
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              headerToolbar={false}
              initialView={getInitialView()}
              events={events}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              height="auto"
              editable={false}
              selectable={false}
              dayMaxEvents={isMobile ? 1 : 3}
              weekends={true}
              nowIndicator={true}
              displayEventTime={true}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: "short",
              }}
              eventDisplay={isMobile ? "list-item" : "auto"}
              dayHeaderFormat={
                calendarView === "dayGridMonth"
                  ? { weekday: "long" }
                  : { weekday: "long", month: "short", day: "numeric" }
              }
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
            />
          </div>

          {entriesLoading && events.length > 0 && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <div className="bg-white/90 border rounded-xl p-4 shadow-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Updating calendar...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog - Keep the same JSX structure */}
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
                  className={cn(
                    "capitalize shrink-0 text-xs px-2 py-1",
                    selectedEvent.extendedProps.status === "Active" &&
                      "bg-green-100 text-green-800 border-green-300",
                    selectedEvent.extendedProps.status === "Finalized" &&
                      "bg-yellow-100 text-yellow-800 border-yellow-300",
                    selectedEvent.extendedProps.status === "Cancelled" &&
                      "bg-red-100 text-red-800 border-red-300"
                  )}
                >
                  {selectedEvent.extendedProps.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              Booking #{selectedEvent?.id} •{" "}
              {selectedEvent?.extendedProps.branch}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6 py-5 px-6">
              {/* Status Update Section — hide if TimeOff */}
              {!selectedEvent.extendedProps.rawData?.TimeOff && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Update Status
                  </h3>

                  {(selectedEvent.extendedProps.status === "Finalized" ||
                    selectedEvent.extendedProps.status === "Cancelled") && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
                      Status is locked and cannot be changed.
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={
                        selectedEvent.extendedProps.status === "Active"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleStatusChange("Active")}
                      disabled={
                        isUpdatingStatus ||
                        selectedEvent.extendedProps.status === "Active" ||
                        selectedEvent.extendedProps.status === "Finalized" ||
                        selectedEvent.extendedProps.status === "Cancelled"
                      }
                      className="flex-1 sm:flex-none min-w-[90px]"
                    >
                      {isUpdatingStatus &&
                      selectedEvent.extendedProps.status !== "Active" ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : null}
                      Active
                    </Button>

                    <Button
                      size="sm"
                      variant={
                        selectedEvent.extendedProps.status === "Finalized"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleStatusChange("Finalized")}
                      disabled={
                        isUpdatingStatus ||
                        selectedEvent.extendedProps.status === "Finalized" ||
                        selectedEvent.extendedProps.status === "Cancelled"
                      }
                      className="flex-1 sm:flex-none min-w-[90px]"
                    >
                      {isUpdatingStatus &&
                      selectedEvent.extendedProps.status !== "Finalized" ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : null}
                      Finalized
                    </Button>

                    <Button
                      size="sm"
                      variant={
                        selectedEvent.extendedProps.status === "Cancelled"
                          ? "destructive"
                          : "outline"
                      }
                      onClick={() => handleStatusChange("Cancelled")}
                      disabled={
                        isUpdatingStatus ||
                        selectedEvent.extendedProps.status === "Cancelled" ||
                        selectedEvent.extendedProps.status === "Finalized"
                      }
                      className="flex-1 sm:flex-none min-w-[90px]"
                    >
                      {isUpdatingStatus &&
                      selectedEvent.extendedProps.status !== "Cancelled" ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : null}
                      Cancelled
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Date & Time Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Schedule
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Date</p>
                      <p className="text-sm truncate">
                        {new Date(selectedEvent.start).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Time</p>
                      <p className="text-sm">
                        {new Date(selectedEvent.start).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(selectedEvent.end).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Staff Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Details
                </h3>
                <div className="space-y-3">
                  {!selectedEvent.extendedProps.rawData?.TimeOff && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Service</p>
                        <p className="text-sm truncate">
                          {selectedEvent.extendedProps.service}
                          {selectedEvent.extendedProps.rawData?.ServiceCode &&
                            ` (${selectedEvent.extendedProps.rawData.ServiceCode})`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Staff</p>
                      <p className="text-sm truncate">
                        {selectedEvent.extendedProps.staff}
                        {selectedEvent.extendedProps.staffName &&
                          ` (${selectedEvent.extendedProps.staffCode})`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Show Customer Section ONLY if NOT Time Off */}
              {!selectedEvent.extendedProps.rawData?.TimeOff && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    Customer Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg border">
                      <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Customer</p>
                        <p className="text-sm truncate">
                          {selectedEvent.extendedProps.customer ||
                            "Not specified"}
                          {selectedEvent.extendedProps.rawData?.CustomerNo &&
                            ` (${selectedEvent.extendedProps.rawData.CustomerNo})`}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.extendedProps.rawData?.PhoneNo && (
                      <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
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
                        <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Email</p>
                          <p className="text-sm truncate">
                            {selectedEvent.extendedProps.rawData.EMail}
                          </p>
                        </div>
                      </div>
                    )}

                    {(selectedEvent.extendedProps.rawData?.Age ?? 0) > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <Cake className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Age</p>
                          <p className="text-sm">
                            {selectedEvent.extendedProps.rawData?.Age} years old
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvent.extendedProps.rawData?.Address && (
                      <div className="flex items-start gap-3 p-3 rounded-lg border">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Address</p>
                          <p className="text-sm">
                            {selectedEvent.extendedProps.rawData.Address}
                            {selectedEvent.extendedProps.rawData.Address2 &&
                              `, ${selectedEvent.extendedProps.rawData.Address2}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      ⏰ Time Off
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
