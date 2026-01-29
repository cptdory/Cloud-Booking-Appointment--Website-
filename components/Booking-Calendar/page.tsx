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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
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
import Swal from "sweetalert2";
import EventDetailsDialog from "@/components/Booking-Calendar/EventDetailsDialog";

// Import hooks
import { useAuth } from "@/hooks/useAuth";
import { useAlert, useModalAlert } from "@/hooks/useAlert";
import { useToast } from "@/hooks/useToast";
import { useStaffColors } from "@/hooks/useStaffColors";
import { useStaffMappings } from "@/hooks/useStaffMappings";
import { useBookingEntries } from "@/hooks/useBookingEntries";

export default function BookingCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);

  // Use hooks
  const { userRole, username, staffCode, customerNo, checkingAuth } = useAuth();
  const { alert, showAlert } = useAlert();
  const { showError: showErrorAlert, showConfirm } = useModalAlert();
  const { showSuccess: showToastSuccess } = useToast();
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
  const [calendarView, setCalendarView] = useState<string>("timeGridWeek");
  const [isMobile, setIsMobile] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDeletingTimeOff, setIsDeletingTimeOff] = useState(false);
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  // Error state for SweetAlert at page level
  const [alertError, setAlertError] = useState<{ title: string; message: string } | null>(null);

  // Show SweetAlert when alertError is set, but do not render as a React child
  useEffect(() => {
    if (alertError) {
      Swal.fire({
        title: alertError.title,
        html: alertError.message,
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: { popup: 'swal-super-high-z' },
        willClose: () => setAlertError(null),
      });
    }
  }, [alertError]);

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
        let eventTitle = "";
        if (entry.TimeOff) {
          eventTitle = "Time Off - " + (entry.BookingNote || "No Reason Specified");
        } else {
          // Show service name and customer name
          const serviceName = entry.ServiceName || "-";
          const customerName = entry.Name || entry.CustomerNo || "-";
          eventTitle = `${serviceName} - ${customerName}`;
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
            customer: entry.Name || entry.CustomerNo,
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
          showErrorAlert(
            "Configuration Error",
            "Could not load staff configuration for this branch."
          );
        }
      } catch (error: any) {
        console.error("Calendar initialization failed:", error);
        showErrorAlert(
          "Initialization Failed",
          error.message || "Failed to load calendar data"
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
          showErrorAlert(
            "Load Error",
            error.message || "Failed to load calendar data for selected period"
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
          showToastSuccess(`Booking status changed to ${newStatus}`);

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
        showErrorAlert(
          "Update Failed",
          error.message || "Failed to update status"
        );
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [selectedEvent, updateBookingStatus, showAlert]
  );

  // Handle delete time off
  const handleDeleteTimeOff = useCallback(async () => {
    if (!selectedEvent?.extendedProps.rawData?.TimeOff) return;

    setIsModalOpen(false);

    const confirmed = await showConfirm(
      "Are you sure you want to delete this time off?",
      "This action cannot be undone.",
      "Delete",
      "Cancel"
    );
    if (!confirmed) return;

    setIsDeletingTimeOff(true);

    try {
      const body = {
        _BookingEntryNo: selectedEvent.extendedProps.rawData?.EntryNo.toString(),
      };

      // 🔥 Log the body being sent
      console.log("Deleting Time Off Body:", body);

      const res = await fetch(
        "/api/booking-staff-timeoff/delete-booking-staff-timeoff",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to delete time off");
      }

      showToastSuccess("Time off deleted successfully!");

      if (currentDateRange) {
        await fetchBookingEntries(
          branchCode,
          currentDateRange.start,
          currentDateRange.end
        );
      }

      setSelectedEvent(null);
    } catch (error: any) {
      showErrorAlert(
        "Delete Failed",
        error.message || "Failed to delete time off"
      );
    } finally {
      setIsDeletingTimeOff(false);
    }
  }, [
    selectedEvent,
    branchCode,
    currentDateRange,
    fetchBookingEntries,
    showAlert,
    showConfirm,
  ]);

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
        <Card className="border-0 dark:border-slate-800 dark:bg-slate-900 shadow-lg">
          <CardContent className="flex items-center justify-center py-16 md:py-20">
            <div className="text-center space-y-5">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-sm"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground dark:text-slate-200">
                  {checkingAuth
                    ? "Checking Authentication..."
                    : "Loading Calendar"}
                </p>
                <p className="text-muted-foreground dark:text-slate-400 max-w-sm mx-auto">
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

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <CardHeader className="pb-4 border-b dark:border-slate-800">
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and View Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Booking Calendar
                </CardTitle>
                <CardDescription className="text-base text-slate-500 dark:text-slate-400">
                  View and manage appointments for {branchCode}
                </CardDescription>
              </div>

              {/* View Controls + Time Off Button */}
              <div className="flex items-center gap-3">
                <StaffTimeOffDialog />

                <div className="hidden sm:flex rounded-lg p-1 bg-slate-100 dark:bg-slate-900 border dark:border-slate-800">
                  <Button
                    variant={
                      calendarView === "dayGridMonth" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleViewChange("dayGridMonth")}
                    className={cn("text-xs h-8 px-3", calendarView !== 'dayGridMonth' && 'dark:text-slate-200 dark:hover:bg-slate-700', calendarView === 'dayGridMonth' && 'dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={
                      calendarView === "timeGridWeek" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleViewChange("timeGridWeek")}
                    className={cn("text-xs h-8 px-3", calendarView !== 'timeGridWeek' && 'dark:text-slate-200 dark:hover:bg-slate-700', calendarView === 'timeGridWeek' && 'dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={
                      calendarView === "timeGridDay" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => handleViewChange("timeGridDay")}
                    className={cn("text-xs h-8 px-3", calendarView !== 'timeGridDay' && 'dark:text-slate-200 dark:hover:bg-slate-700', calendarView === 'timeGridDay' && 'dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700')}
                  >
                    Day
                  </Button>
                  <Button
                    variant={calendarView === "listWeek" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewChange("listWeek")}
                    className={cn("text-xs h-8 px-3", calendarView !== 'listWeek' && 'dark:text-slate-200 dark:hover:bg-slate-700', calendarView === 'listWeek' && 'dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700')}
                  >
                    List
                  </Button>
                </div>

                {/* Mobile view indicator */}
                {isMobile && (
                  <div className="sm:hidden flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700">
                    <Smartphone className="w-4 h-4" />
                    <span>List View</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Navigation and Current Period */}
            <div className="flex flex-col sm:flex-row sm:items-center  justify-between gap-3">
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
                <h3 className="text-lg font-semibold px-4 py-2 rounded-lg border dark:border-slate-700 dark:text-slate-200">
                  {currentTitle}
                </h3>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 relative">
          <div className="rounded-xl overflow-hidden border dark:border-slate-800 shadow-sm">
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
              displayEventTime={calendarView === "listWeek"}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: "short",
              }}
              eventDisplay={isMobile ? "list-item" : "auto"}
              dayHeaderFormat={
                calendarView === "dayGridMonth"
                  ? { weekday: "long" }
                  : { weekday: "short", day: "numeric" }
              }
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
            />
          </div>

          {entriesLoading && events.length > 0 && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <div className="bg-white/90 dark:bg-slate-900/90 border dark:border-slate-700 rounded-xl p-4 shadow-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium dark:text-slate-200">
                  Updating calendar...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog Component */}
      <EventDetailsDialog
        selectedEvent={selectedEvent}
        isModalOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onStatusChange={handleStatusChange}
        onDeleteTimeOff={handleDeleteTimeOff}
        isUpdatingStatus={isUpdatingStatus}
        isDeletingTimeOff={isDeletingTimeOff}
        userRole={userRole || ""}
        staffCode={staffCode || ""}
        onShowTimeOffDialog={() => {
          setShowTimeOffDialog(true);
        }}
      />

      {/* Time Off Dialog (for create/update) */}
      {showTimeOffDialog && (
        <StaffTimeOffDialog
          open={showTimeOffDialog}
          onOpenChange={setShowTimeOffDialog}
          initialData={
            selectedEvent?.extendedProps.rawData?.TimeOff
              ? {
                  entryNo: selectedEvent.id,
                  staffCode: selectedEvent.extendedProps.staffCode,
                  staffName: selectedEvent.extendedProps.staff,
                  date: new Date(selectedEvent.start),
                  startTime: selectedEvent.extendedProps.rawData.BookingStartTime?.substring(0, 5) || "",
                  endTime: selectedEvent.extendedProps.rawData.BookingEndTime?.substring(0, 5) || "",
                  wholeDay: !selectedEvent.extendedProps.rawData.BookingStartTime && !selectedEvent.extendedProps.rawData.BookingEndTime,
                  reason: selectedEvent.extendedProps.description || "",
                }
              : undefined
          }
          onSuccess={() => {
            setShowTimeOffDialog(false);
            setIsModalOpen(false);
            // Refresh calendar data to show the updated time off entry
            if (currentDateRange) {
              fetchBookingEntries(
                branchCode,
                currentDateRange.start,
                currentDateRange.end
              );
            }
          }}
          onError={(title, message) => setAlertError({ title, message })}
        />
      )}

      {/* SweetAlert is now triggered by useEffect, not rendered here */}
    </div>
  );
}
