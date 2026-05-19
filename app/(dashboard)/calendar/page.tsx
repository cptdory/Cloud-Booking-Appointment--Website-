// app/(dashboard)/calendar/page.tsx
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CalendarCheck, Plus, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { BookingEntriesData } from "@/types/bc-types";
import { sileo } from "sileo";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    entryNo: string;
    staff: string;
    room: string;
    timeOff: boolean;
    wholeDayOff: boolean;
  };
  color: string;
}

interface SessionUser {
  name: string;
  email: string;
  role: string;
  booking_setup_code: string;
  staff_code?: string;
  is_admin?: boolean;
}

interface TimeOffFormState {
  staffCode: string;
  staffName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  wholeDay: boolean;
  singleDay: boolean;
}

interface StaffItem {
  id: string;
  code: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const localizer = momentLocalizer(moment);

const DEFAULT_TIME_OFF_FORM: TimeOffFormState = {
  staffCode: "",
  staffName: "",
  startDate: moment().format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
  startTime: "09:00",
  endTime: "17:00",
  reason: "",
  wholeDay: false,
  singleDay: false,
};

const SILEO_FILL = "#171717";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isTimeOff = (entry?: BookingEntriesData | null) =>
  String(entry?.TimeOff) === "true";

const isWholeDay = (entry: BookingEntriesData) =>
  String(entry?.WholeDayOff) === "true";

// 24h "HH:mm" → 12h "hh:mm AM/PM"
const to12Hour = (time24: string): string => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${m} ${ampm}`;
};

// 12h "hh:mm AM/PM" → 24h "HH:mm"
const to24Hour = (time12: string): string => {
  if (!time12) return "09:00";
  const trimmed = time12.trim();
  const parts = trimmed.split(" ");
  if (parts.length === 1) return parts[0]; // already 24h
  const [timePart, meridiem] = parts;
  const [h, m] = timePart.split(":");
  let hour = parseInt(h, 10);
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (meridiem === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${m}`;
};

const transformToCalendarEvents = (data: BookingEntriesData[]): CalendarEvent[] =>
  data.map((entry) => ({
    id: entry.EntryNo,
    title: isTimeOff(entry)
      ? `Time Off - ${entry.StaffName || entry.StaffCode}`
      : `${entry.ServiceName} - ${entry.Name || "No Customer"}`,
    start: new Date(`${entry.BookingStartDate}T${entry.BookingStartTime}`),
    end: new Date(`${entry.BookingEndDate}T${entry.BookingEndTime}`),
    resource: {
      entryNo: entry.EntryNo,
      staff: entry.StaffName,
      room: entry.BookingParameters?.ROOM?.BookingParameterValueCode || "N/A",
      timeOff: isTimeOff(entry),
      wholeDayOff: isWholeDay(entry),
    },
    color: entry.StaffColor || "#3b82f6",
  }));

const normaliseRange = (
  range: Date[] | { start: Date; end: Date }
): { start: Date; end: Date } => {
  if (Array.isArray(range)) {
    return { start: range[0], end: range[range.length - 1] };
  }
  return { start: range.start, end: range.end };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    {label && (
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
    )}
    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
      {value || "—"}
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span className="font-semibold text-gray-700">{label}: </span>
    <span className="text-gray-600">{value}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<BookingEntriesData[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => ({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  }));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Active", "Cancelled", "Finalized", "No Show"]);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [hideTimeOff, setHideTimeOff] = useState(true);
  const [currentView, setCurrentView] = useState<View>("week");
  const isMobile = useIsMobile();

  const [selectedEvent, setSelectedEvent] = useState<BookingEntriesData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("Active");
  const [showEventDialog, setShowEventDialog] = useState(false);

  const [showAddTimeOffDialog, setShowAddTimeOffDialog] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState<TimeOffFormState>(DEFAULT_TIME_OFF_FORM);
  const [isSubmittingTimeOff, setIsSubmittingTimeOff] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEntryNo, setEditEntryNo] = useState<string>("");

  const [businessHours, setBusinessHours] = useState({
    min: moment().startOf("day").toDate(),
    max: moment().endOf("day").toDate(),
  });

  // ── Session ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setSessionUser(data.user ?? null))
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (!sessionUser?.booking_setup_code) return;  // Wait for session user
    handleGetBusinessStartTime();
  }, [sessionUser]);
  // ── Staff list ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionUser?.booking_setup_code) return;
    fetch("/api/booking-branch-setup/get-booking-setup")
      .then((r) => r.json())
      .then((data) => {
        const staffParam = data?.[0]?.BookingParameter?.find(
          (p: any) => p.BookingParameterCode === "Staff"
        );
        const list: StaffItem[] =
          staffParam?.BookingParameterValue?.map((v: any) => ({
            id: v.BookingParameterValueId,
            code: v.BookingParameterValueCode,
            description: v.BookingParameterValueDescription,
          })) ?? [];

        setStaffList(
          sessionUser.role === "user" && !sessionUser.is_admin
            ? list.filter((s) => s.code === sessionUser.staff_code)
            : list
        );
      })
      .catch(console.error);
  }, [sessionUser]);

  // ── Fetch entries ────────────────────────────────────────────────────────────
  const fetchBookingEntries = useCallback(
    async (start: Date, end: Date) => {
      if (!sessionUser?.booking_setup_code) return;
      try {
        setLoadingCalendar(true);
        const res = await fetch("/api/booking-entry/get-booking-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode: sessionUser.booking_setup_code,
            dateFrom: moment(start).format("YYYY-MM-DD"),
            dateTo: moment(end).format("YYYY-MM-DD"),
            status: "",
          }),
        });
        const data = await res.json();
        const entries: BookingEntriesData[] = Array.isArray(data) ? data : [];
        setCalendarEvents(entries);
        setEvents(transformToCalendarEvents(entries));
      } catch (err) {
        console.error(err);
        sileo.error({ title: "Failed to load calendar entries.", fill: SILEO_FILL });
      } finally {
        setLoadingCalendar(false);
      }
    },
    [sessionUser?.booking_setup_code]
  );

  useEffect(() => {
    console.log("sessionUser:", sessionUser);
    if (sessionUser) fetchBookingEntries(dateRange.start, dateRange.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser]);

  useLayoutEffect(() => {
    const timeout = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [currentView]);

  useEffect(() => {
    if (isMobile) {
      setCurrentView("agenda");
    } else if (currentView === "agenda") {
      setCurrentView("week");
    }
  }, [isMobile]);

  // ── Calendar handlers ────────────────────────────────────────────────────────
  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      const { start, end } = normaliseRange(range);
      setDateRange({ start, end });
      fetchBookingEntries(start, end);
    },
    [fetchBookingEntries]
  );

  useEffect(() => {
    if (!loadingCalendar) {
      const timeout = window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
      return () => window.clearTimeout(timeout);
    }
  }, [events, currentView, businessHours, loadingCalendar]);

  const handleSelectEvent = (event: CalendarEvent) => {
    const entry = calendarEvents.find((e) => e.EntryNo === event.id);
    if (entry) {
      setSelectedEvent(entry);
      setSelectedStatus(entry.BookingStatus || "Active");
      setShowEventDialog(true);
    }
  };

  const handleStatusToggle = (s: string) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // ── Delete time off ──────────────────────────────────────────────────────────
  const handleDeleteTimeOff = async () => {
    if (!selectedEvent) return;
    try {
      setLoadingCalendar(true);
      const res = await fetch(
        "/api/booking-entry-staff-timeoff/delete-booking-entry-staff-timeoff",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingEntryNo: String(selectedEvent.EntryNo) }),
        }
      );
      if (!res.ok) throw new Error();
      setShowEventDialog(false);
      setSelectedEvent(null);
      await fetchBookingEntries(dateRange.start, dateRange.end);
      sileo.success({ title: "Time off deleted successfully.", fill: SILEO_FILL });
    } catch {
      sileo.error({ title: "Failed to delete time off.", fill: SILEO_FILL });
    } finally {
      setLoadingCalendar(false);
    }
  };

  // ── update booking ───────────────────────────────────────────────────────────
  const handleUpdateBookingEntry = async (status: string = "Cancelled") => {
    if (!selectedEvent) return;
    try {
      setLoadingCalendar(true);
      const res = await fetch("/api/booking-entry/update-booking-entry-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryNo: String(selectedEvent.EntryNo),
          bookingStatus: status,
        }),
      });
      if (!res.ok) throw new Error();
      setShowEventDialog(false);
      setSelectedEvent(null);
      await fetchBookingEntries(dateRange.start, dateRange.end);
      sileo.success({ title: `Booking status updated to ${status}.`, fill: SILEO_FILL });
    } catch {
      sileo.error({ title: "Failed to update booking status.", fill: SILEO_FILL });
    } finally {
      setLoadingCalendar(false);
    }
  };

  // ── Time off dialog ──────────────────────────────────────────────────────────
  const handleOpenAddTimeOffDialog = () => {
    setTimeOffForm(DEFAULT_TIME_OFF_FORM);
    setIsEditMode(false);
    setEditEntryNo("");
    setShowAddTimeOffDialog(true);
  };

  const handleOpenEditTimeOffDialog = () => {
    if (!selectedEvent) return;
    const wholeDay = isWholeDay(selectedEvent);
    const startDate = selectedEvent.BookingStartDate
      ? moment(selectedEvent.BookingStartDate).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const endDate = selectedEvent.BookingEndDate
      ? moment(selectedEvent.BookingEndDate).format("YYYY-MM-DD")
      : startDate;

    setTimeOffForm({
      staffCode: selectedEvent.StaffCode || "",
      staffName: selectedEvent.StaffName || "",
      startDate,
      endDate,
      startTime: wholeDay ? "09:00" : to24Hour(selectedEvent.BookingStartTime),
      endTime: wholeDay ? "17:00" : to24Hour(selectedEvent.BookingEndTime),
      reason: selectedEvent.BookingNote || "",
      wholeDay,
      singleDay: startDate === endDate,
    });
    setIsEditMode(true);
    setEditEntryNo(String(selectedEvent.EntryNo));
    setShowEventDialog(false);
    setShowAddTimeOffDialog(true);
  };

  const handleCloseAddTimeOffDialog = () => {
    setShowAddTimeOffDialog(false);
    setTimeOffForm(DEFAULT_TIME_OFF_FORM);
    setIsEditMode(false);
    setEditEntryNo("");
  };

  const handleTimeOffFormChange = (field: keyof TimeOffFormState, value: any) => {
    setTimeOffForm((prev) => {
      if (field === "staffCode") {
        const staff = staffList.find((s) => s.code === value);
        return { ...prev, staffCode: value, staffName: staff?.description || "" };
      }
      if (field === "singleDay") {
        return { ...prev, singleDay: value, endDate: value ? prev.startDate : prev.endDate };
      }
      if (field === "startDate" && prev.singleDay) {
        return { ...prev, startDate: value, endDate: value };
      }
      return { ...prev, [field]: value };
    });
  };

  // ── Create time off ──────────────────────────────────────────────────────────
  const handleCreateTimeOff = async () => {
    const { staffCode, staffName, startDate, endDate, startTime, endTime, wholeDay, reason } =
      timeOffForm;
    if (!staffCode || !startDate || !endDate) {
      sileo.error({ title: "Please select staff and date.", fill: SILEO_FILL });
      return;
    }
    try {
      setIsSubmittingTimeOff(true);
      const res = await fetch(
        "/api/booking-entry-staff-timeoff/create-booking-entry-staff-timeoff",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode: sessionUser?.booking_setup_code,
            staffCode,
            staffName,
            timeOffStartDate: moment(startDate).format("MM/DD/YYYY"),
            timeOffEndDate: moment(endDate).format("MM/DD/YYYY"),
            timeOffStartTime: wholeDay ? "" : to12Hour(startTime),
            timeOffEndTime: wholeDay ? "" : to12Hour(endTime),
            wholeDay: wholeDay ? "true" : "false",
            timeOffReason: reason || "",
          }),
        }
      );
      if (!res.ok) throw new Error();
      handleCloseAddTimeOffDialog();
      await fetchBookingEntries(dateRange.start, dateRange.end);
      sileo.success({ title: "Time off created successfully.", fill: SILEO_FILL });
    } catch {
      sileo.error({ title: "Failed to create time off.", fill: SILEO_FILL });
    } finally {
      setIsSubmittingTimeOff(false);
    }
  };

  // ── Update time off ──────────────────────────────────────────────────────────
  const handleUpdateTimeOff = async () => {
    const { staffCode, staffName, startDate, startTime, endTime, wholeDay, reason } = timeOffForm;
    if (!staffCode || !startDate) {
      sileo.error({ title: "Please select staff and date.", fill: SILEO_FILL });
      return;
    }
    try {
      setIsSubmittingTimeOff(true);
      const res = await fetch(
        "/api/booking-entry-staff-timeoff/update-booking-entry-staff-timeoff",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode: sessionUser?.booking_setup_code,
            staffCode,
            staffName,
            timeOffDate: moment(startDate).format("MM/DD/YYYY"),
            timeOffStartTime: wholeDay ? "" : to12Hour(startTime),
            timeOffEndTime: wholeDay ? "" : to12Hour(endTime),
            wholeDay: wholeDay ? "true" : "false",
            timeOffReason: reason || "",
            bookingEntryNo: editEntryNo,
          }),
        }
      );
      if (!res.ok) throw new Error();
      handleCloseAddTimeOffDialog();
      await fetchBookingEntries(dateRange.start, dateRange.end);
      sileo.success({ title: "Time off updated successfully.", fill: SILEO_FILL });
    } catch {
      sileo.error({ title: "Failed to update time off.", fill: SILEO_FILL });
    } finally {
      setIsSubmittingTimeOff(false);
    }
  };
  // ── Get Business Hours ──────────────────────────────────────────────────────────
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  const handleGetBusinessStartTime = async () => {
    try {
      const res = await fetch(
        "/api/business-hours/get-booking-earliest-business-start-time",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchCode: sessionUser?.booking_setup_code,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      const min = parseTime(data["Earliest Start Time"]);
      min.setHours(min.getHours() - 3);
      const max = parseTime(data["Latest End Time"]);
      max.setHours(max.getHours() + 3);
      setBusinessHours({ min, max, });
    } catch {
      sileo.error({
        title: "Failed to get business hours.",
        fill: SILEO_FILL,
      });
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const canManageTimeOff =
    sessionUser?.role !== "user" ||
    sessionUser?.is_admin === true ||
    selectedEvent?.StaffCode === sessionUser?.staff_code;

  const filteredEvents = events
    .filter((e) => (hideTimeOff ? !e.resource.timeOff : true))
    .filter((e) => {
      const entry = calendarEvents.find((c) => c.EntryNo === e.id);
      return entry ? selectedStatuses.includes(entry.BookingStatus) : true;
    });

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Calendar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Status
              <span className="rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5">
                {selectedStatuses.length}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 bg-white shadow-md py-1">
                  {(["Active", "Cancelled", "Finalized", "No Show"] as const).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(s)}
                        onChange={() => handleStatusToggle(s)}
                        className="rounded border-gray-300 accent-blue-600 cursor-pointer focus:ring-blue-500"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hide time off */}
          <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={hideTimeOff}
              onChange={(e) => setHideTimeOff(e.target.checked)}
              className="rounded border-gray-300 accent-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500"
            />
            Hide Time Off
          </label>

          <button
            onClick={handleOpenAddTimeOffDialog}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Time Off
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
        <div className="flex flex-col flex-1 rounded-lg border border-blue-100 bg-white shadow-sm p-4 sm:p-6">
          {/* Calendar — fills remaining vertical space, no scroll */}
          <div className="relative flex-1 min-h-0 compact-calendar">
            <style>{`
              .compact-calendar .rbc-timeslot-group { min-height: 30px; }
              .compact-calendar .rbc-time-slot { min-height: 20px; }
            `}</style>
            {/* Loading overlay */}
            {loadingCalendar && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  <span className="text-sm font-medium text-slate-500">Loading appointments…</span>
                </div>
              </div>
            )}
            <Calendar
              key={currentView}
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              min={businessHours.min}
              max={businessHours.max}
              popup
              style={{ height: currentView === "month" ? "auto" : "100%", minHeight: 500 }}
              onRangeChange={handleRangeChange}
              onSelectEvent={handleSelectEvent}
              view={currentView}
              onView={(view) => setCurrentView(view)}
              formats={{
                eventTimeRangeFormat: () => "",
              }}
              eventPropGetter={(event: any) => {
                // Lookup the original booking entry to inspect its status
                const entry = calendarEvents.find((c) => String(c.EntryNo) === String(event.id));
                const isCancelled = entry?.BookingStatus === "Cancelled" || entry?.BookingStatus === "No Show";
                const backgroundColor = isCancelled
                  ? "#818182" // light gray for cancelled
                  : (currentView === "week" || currentView === "day")
                    ? event.color || "#3b82f6"
                    : "transparent";

                return {
                  style: {
                    backgroundColor,
                    opacity: 0.9,
                    color: "black",
                    borderRadius: "4px",
                    border: "none",
                    padding: "1px 4px",
                    fontSize: "11px",
                  },
                };
              }}
              components={{
                event: ({ event }: any) => {
                  const entry = calendarEvents.find((c) => String(c.EntryNo) === String(event.id));
                  console.log("Rendering event:", { event, entry });
                  const isNoShow = entry?.BookingStatus === "No Show";
                  const isFinalized = entry?.BookingStatus === "Finalized";
                  const isRescheduled = entry?.Rescheduled;
                  return (
                    <div className="text-[11px] leading-tight overflow-hidden">
                      <div className="flex items-start gap-1">
                        {currentView !== "week" && currentView !== "day" && (
                          <Badge
                            style={{ backgroundColor: event.color }}
                            className="p-0.5 shrink-0"
                          />
                        )}

                        {isNoShow ? (
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        ) : isRescheduled ? (
                          <RefreshCw className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : isFinalized ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : null}

                        <span className="block truncate text-[13px]">
                          {event.title}
                        </span>
                      </div>
                    </div>
                  );
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Event Details Dialog ── */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {isTimeOff(selectedEvent)
                ? "Time Off Details"
                : selectedEvent?.ServiceName || "Event Details"}
            </DialogTitle>
            <DialogDescription>
              {isTimeOff(selectedEvent) ? "Time Off" : "Booking Details"}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-800">
              {!isTimeOff(selectedEvent) && (
                <>
                  <DetailRow label="Customer" value={`${selectedEvent.Name} ${selectedEvent.Name2 || ""}`.trim()} />
                  <DetailRow label="Phone" value={selectedEvent.PhoneNo || "N/A"} />
                  <DetailRow label="Email" value={selectedEvent.EMail || "N/A"} />
                  <DetailRow label="Address" value={`${selectedEvent.Address} ${selectedEvent.Address2 || ""}`.trim()} />
                </>
              )}
              <DetailRow label="Staff" value={selectedEvent.StaffName || "N/A"} />
              {selectedEvent.BookingParameters?.ROOM && (
                <DetailRow label="Room" value={selectedEvent.BookingParameters.ROOM.BookingParameterValueCode} />
              )}
              <DetailRow
                label="Date & Time"
                value={`${moment(selectedEvent.BookingStartDate).format("MMM DD, YYYY")} ${moment(selectedEvent.BookingStartTime, "HH:mm:ss").format("hh:mm A")} - ${moment(selectedEvent.BookingEndTime, "HH:mm:ss").format("hh:mm A")}`}
              />
              <DetailRow label="Status" value={selectedEvent.BookingStatus} />
              {String(selectedEvent.Rescheduled).toLowerCase() === "true" && (
                <DetailRow
                  label="Rescheduled"
                  value={
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      Yes
                    </span>
                  }
                />
              )}
              {!isTimeOff(selectedEvent) && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-700">Update Booking Status</div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Finalized">Finalized</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="No Show">No Show</option>
                    </select>
                    <button
                      onClick={() => handleUpdateBookingEntry(selectedStatus)}
                      disabled={loadingCalendar}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-2xl shadow-sm transition hover:bg-blue-700"
                    >
                      {loadingCalendar ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              )}
              {selectedEvent.BookingNote && (
                <DetailRow label="Notes" value={selectedEvent.BookingNote} />
              )}
            </div>
          )}

          <DialogFooter className="flex w-full items-center gap-3">
            {selectedEvent && isTimeOff(selectedEvent) ? (
              canManageTimeOff ? (
                <>
                  <div className="pr-4 border-r border-gray-200">
                    <button
                      onClick={handleDeleteTimeOff}
                      disabled={loadingCalendar}
                      className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-2xl shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingCalendar ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                  <div className="flex gap-2 ml-auto pl-4">
                    <button
                      onClick={handleOpenEditTimeOffDialog}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-2xl shadow-sm transition hover:bg-blue-700"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setShowEventDialog(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl transition hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="ml-auto">
                  <button
                    onClick={() => setShowEventDialog(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl transition hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="flex gap-2 ml-auto pl-4">
                  {selectedEvent?.BookingStatus === "Active" && (
                    <button
                      onClick={() => {
                        if (!selectedEvent) return;
                        window.location.href = `/book-now?reschedule=${selectedEvent.EntryNo}`;
                      }}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-2xl shadow-sm transition hover:bg-blue-700"
                    >
                      Reschedule
                    </button>
                  )}
                  <button
                    onClick={() => setShowEventDialog(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl transition hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Time Off Dialog ── */}
      <Dialog open={showAddTimeOffDialog} onOpenChange={setShowAddTimeOffDialog}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Update" : "Add"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the time off entry for staff"
                : "Create a new time off entry for staff"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Staff */}
            {isEditMode ? (
              <ReadonlyField
                label="Staff"
                value={
                  timeOffForm.staffName
                    ? `${timeOffForm.staffName} (${timeOffForm.staffCode})`
                    : timeOffForm.staffCode
                }
              />
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select Staff *
                </label>
                <select
                  value={timeOffForm.staffCode}
                  onChange={(e) => handleTimeOffFormChange("staffCode", e.target.value)}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Staff --</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.code}>
                      {staff.description} ({staff.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Start Date *</label>
                <input
                  type="date"
                  value={timeOffForm.startDate}
                  onChange={(e) => handleTimeOffFormChange("startDate", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">End Date *</label>
                {isEditMode ? (
                  <ReadonlyField label="" value={timeOffForm.endDate} />
                ) : (
                  <input
                    type="date"
                    value={timeOffForm.endDate}
                    min={timeOffForm.startDate}
                    readOnly={timeOffForm.singleDay}
                    onChange={(e) =>
                      !timeOffForm.singleDay && handleTimeOffFormChange("endDate", e.target.value)
                    }
                    className={`w-full rounded-2xl border px-3 py-2 text-sm text-slate-900 focus:outline-none ${timeOffForm.singleDay
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-blue-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      }`}
                  />
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label
                className={`flex items-center gap-2 text-sm font-semibold ${isEditMode ? "text-gray-400 cursor-not-allowed" : "text-gray-700 cursor-pointer"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={timeOffForm.singleDay}
                  disabled={isEditMode}
                  onChange={(e) => !isEditMode && handleTimeOffFormChange("singleDay", e.target.checked)}
                  className={`rounded accent-blue-600 cursor-pointer ${isEditMode ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                />
                Single Day
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timeOffForm.wholeDay}
                  onChange={(e) => handleTimeOffFormChange("wholeDay", e.target.checked)}
                  className="rounded accent-blue-600 cursor-pointer"
                />
                Whole Day
              </label>
            </div>

            {/* Times */}
            {!timeOffForm.wholeDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={timeOffForm.startTime}
                    onChange={(e) => handleTimeOffFormChange("startTime", e.target.value)}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={timeOffForm.endTime}
                    onChange={(e) => handleTimeOffFormChange("endTime", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Reason</label>
              <input
                type="text"
                value={timeOffForm.reason}
                onChange={(e) => handleTimeOffFormChange("reason", e.target.value)}
                placeholder="e.g., Vacation, Sick Leave, Personal"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                onClick={handleCloseAddTimeOffDialog}
                disabled={isSubmittingTimeOff}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? handleUpdateTimeOff : handleCreateTimeOff}
                disabled={isSubmittingTimeOff}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSubmittingTimeOff
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                    ? "Update"
                    : "Add"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}