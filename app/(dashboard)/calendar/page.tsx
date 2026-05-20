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
import { Plus, PhoneIcon, MailIcon, MapPinIcon, AlertCircle, CheckCircle, RefreshCw, CalendarIcon, ClockIcon, UserIcon, BriefcaseIcon, DoorOpenIcon, RefreshCwIcon } from "lucide-react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const [businessHours, setBusinessHours] = useState({
    min: moment().startOf("day").toDate(),
    max: moment().endOf("day").toDate(),
  });
const calendarContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!calendarContainerRef.current) return;

  const observer = new ResizeObserver(() => {
    window.dispatchEvent(new Event("resize"));
  });

  observer.observe(calendarContainerRef.current);
  return () => observer.disconnect();
}, []);
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
    if (sessionUser) fetchBookingEntries(dateRange.start, dateRange.end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser]);

  // ── Update selected event when calendar events change ──────────────────────
  useEffect(() => {
    if (selectedEvent && showEventDialog) {
      const updatedEvent = calendarEvents.find((e) => e.EntryNo === selectedEvent.EntryNo);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    }
  }, [calendarEvents, selectedEvent, showEventDialog]);

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
  const handleUpdateBookingEntry = async (status: string = "Cancelled", keepDialogOpen: boolean = false) => {
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
      if (!keepDialogOpen) {
        setShowEventDialog(false);
        setSelectedEvent(null);
      }
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
      <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-3 border-b bg-white px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:py-0">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-2 hidden data-[orientation=vertical]:h-4 sm:block" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Calendar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
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
          <label className="flex min-h-10 items-center gap-2 cursor-pointer select-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
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
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Time Off
          </button>
        </div>
      </header>
{/* Main */}
<div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-blue-100 bg-white p-3 shadow-sm sm:p-6">
    <div className="relative flex min-h-[70vh] min-w-0 flex-1 overflow-hidden rounded-lg compact-calendar sm:min-h-[calc(100svh-11rem)]" ref={calendarContainerRef}>
      <style>{`
        .compact-calendar { width: 100%; }
        .compact-calendar .rbc-calendar { width: 100% !important; min-width: 0; }
        .compact-calendar .rbc-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .compact-calendar .rbc-toolbar .rbc-btn-group {
          display: flex;
          flex-wrap: wrap;
        }
        .compact-calendar .rbc-header,
        .compact-calendar .rbc-time-header-content,
        .compact-calendar .rbc-time-content,
        .compact-calendar .rbc-time-view,
        .compact-calendar .rbc-month-view,
        .compact-calendar .rbc-agenda-view {
          min-width: 0;
        }
        .compact-calendar .rbc-timeslot-group { min-height: 30px; }
        .compact-calendar .rbc-time-slot { min-height: 20px; }
        .compact-calendar .rbc-month-view { width: 100% !important; }
      `}</style>

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
        style={{ height: "100%", width: "100%", minHeight: "100%" }}
        onRangeChange={handleRangeChange}
        onSelectEvent={handleSelectEvent}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        formats={{ eventTimeRangeFormat: () => "" }}
        eventPropGetter={(event: any) => {
          const entry = calendarEvents.find((c) => String(c.EntryNo) === String(event.id));
          const isCancelled = entry?.BookingStatus === "Cancelled" || entry?.BookingStatus === "No Show";
          const backgroundColor = isCancelled
            ? "#818182"
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
            const isNoShow = entry?.BookingStatus === "No Show";
            const isFinalized = entry?.BookingStatus === "Finalized";
            const isRescheduled = entry?.Rescheduled;
            return (
              <div className="text-[11px] leading-tight overflow-hidden">
                <div className="flex items-start gap-1">
                  {currentView !== "week" && currentView !== "day" && (
                    <Badge style={{ backgroundColor: event.color }} className="p-0.5 shrink-0" />
                  )}
                  {isNoShow ? (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  ) : isRescheduled ? (
                    <RefreshCw className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : isFinalized ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : null}
                  <span className="block truncate text-[13px]">{event.title}</span>
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
  <DialogContent className="sm:max-w-2xl p-0 gap-0">

    {/* Header */}
    <DialogHeader className="px-5 py-4 border-b border-slate-100">
      {selectedEvent && (
        <div className="flex-1 min-w-0">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            {isTimeOff(selectedEvent) ? "Time Off Details" : selectedEvent?.ServiceName || "Event Details"}
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
              selectedEvent.BookingStatus === "Active" ? "bg-green-100 text-green-700" :
              selectedEvent.BookingStatus === "Cancelled" ? "bg-red-100 text-red-700" :
              selectedEvent.BookingStatus === "Finalized" ? "bg-blue-100 text-blue-700" :
              selectedEvent.BookingStatus === "No Show" ? "bg-orange-100 text-orange-700" :
              "bg-slate-100 text-slate-700"
            }`}>
              {selectedEvent.BookingStatus}
            </span>
            {String(selectedEvent.Rescheduled).toLowerCase() === "true" && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Rescheduled
              </span>
            )}
          </DialogTitle>
          {!isTimeOff(selectedEvent) && (
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {selectedEvent?.ServiceDuration ? `${selectedEvent.ServiceDuration} mins` : ""}
              {selectedEvent?.ServicePrice != null && (
                <>
                  {selectedEvent?.ServiceDuration ? " · " : ""}
                  {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(selectedEvent.ServicePrice))}
                </>
              )}
            </DialogDescription>
          )}
        </div>
      )}
    </DialogHeader>

    {/* Body */}
    {selectedEvent && (
      <div className="px-5 py-4 space-y-4">

        {/* Schedule + Professional */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Schedule</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {moment(selectedEvent.BookingStartDate).format("MMM DD, YYYY")}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <ClockIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {moment(selectedEvent.BookingStartTime, "HH:mm:ss").format("hh:mm A")}
                {" – "}
                {moment(selectedEvent.BookingEndTime, "HH:mm:ss").format("hh:mm A")}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Professional</h3>
            <div className="flex items-center gap-2 text-sm text-slate-800">
              <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {selectedEvent.StaffName || "—"}
            </div>
            {selectedEvent.BookingParameters?.ROOM && (
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <DoorOpenIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {selectedEvent.BookingParameters.ROOM.BookingParameterValueCode}
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        {!isTimeOff(selectedEvent) && (
          <>
            <div className="border-t border-slate-100" />
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Customer Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-800 min-w-0">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{`${selectedEvent.Name} ${selectedEvent.Name2 || ""}`.trim() || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800 min-w-0">
                  <PhoneIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{selectedEvent.PhoneNo || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800 min-w-0">
                  <MailIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{selectedEvent.EMail || "—"}</span>
                </div>
                {(`${selectedEvent.Address} ${selectedEvent.Address2 || ""}`.trim()) && (
                  <div className="flex items-center gap-2 text-sm text-slate-800 min-w-0">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{`${selectedEvent.Address} ${selectedEvent.Address2 || ""}`.trim()}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div className="border-t border-slate-100" />
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Notes</h3>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 whitespace-pre-line min-h-[2.5rem]">
            {selectedEvent.BookingNote || "—"}
          </div>
        </div>

      </div>
    )}

    {/* Footer — plain div to avoid DialogFooter overflow quirks */}
    <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 w-full">
      {selectedEvent && isTimeOff(selectedEvent) ? (
        canManageTimeOff ? (
          <>
            <button
              onClick={handleDeleteTimeOff}
              disabled={loadingCalendar}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCalendar ? "Deleting..." : "Delete"}
            </button>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleOpenEditTimeOffDialog}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm transition hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => setShowEventDialog(false)}
                className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowEventDialog(false)}
            className="ml-auto px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg transition hover:bg-slate-200"
          >
            Close
          </button>
        )
      ) : (
        <>
          {!isTimeOff(selectedEvent) && (
            <button
              onClick={() => setShowStatusDialog(true)}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-600 rounded-lg shadow-sm transition hover:bg-slate-700"
            >
              Update Status
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {selectedEvent?.BookingStatus === "Active" && (
              <button
                onClick={() => {
                  if (!selectedEvent) return;
                  window.location.href = `/book-now?reschedule=${selectedEvent.EntryNo}`;
                }}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm transition hover:bg-blue-700"
              >
                Reschedule
              </button>
            )}
            <button
              onClick={() => setShowEventDialog(false)}
              className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg transition hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>

  </DialogContent>
</Dialog>
{/* ── Add / Edit Time Off Dialog ── */}
<Dialog open={showAddTimeOffDialog} onOpenChange={setShowAddTimeOffDialog}>
  <DialogContent className="sm:max-w-2xl p-0 gap-0">

    {/* Header */}
    <DialogHeader className="px-5 py-4 border-b border-slate-100">
      <DialogTitle className="text-xl font-bold text-slate-900">
        {isEditMode ? "Update Time Off" : "Add Time Off"}
      </DialogTitle>
      <DialogDescription className="text-xs text-slate-500 mt-0.5">
        {isEditMode
          ? "Update the time off entry for staff"
          : "Create a new time off entry for staff"}
      </DialogDescription>
    </DialogHeader>

    {/* Body */}
    <div className="px-5 py-4 space-y-4">

      {/* Staff */}
      {isEditMode ? (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Staff</h3>
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {timeOffForm.staffName
              ? `${timeOffForm.staffName} (${timeOffForm.staffCode})`
              : timeOffForm.staffCode}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Select Staff <span className="text-red-400">*</span>
          </label>
          <select
            value={timeOffForm.staffCode}
            onChange={(e) => handleTimeOffFormChange("staffCode", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">— Select Staff —</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.code}>
                {staff.description} ({staff.code})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="border-t border-slate-100" />

      {/* Dates */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Schedule</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">
              Start Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={timeOffForm.startDate}
              onChange={(e) => handleTimeOffFormChange("startDate", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">
              End Date <span className="text-red-400">*</span>
            </label>
            {isEditMode ? (
              <div className="flex items-center gap-2 text-sm text-slate-800 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50">
                {timeOffForm.endDate || "—"}
              </div>
            ) : (
              <input
                type="date"
                value={timeOffForm.endDate}
                min={timeOffForm.startDate}
                readOnly={timeOffForm.singleDay}
                onChange={(e) =>
                  !timeOffForm.singleDay && handleTimeOffFormChange("endDate", e.target.value)
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none ${
                  timeOffForm.singleDay
                    ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "border-slate-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className={`flex items-center gap-2 text-sm font-medium ${
          isEditMode ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"
        }`}>
          <input
            type="checkbox"
            checked={timeOffForm.singleDay}
            disabled={isEditMode}
            onChange={(e) => !isEditMode && handleTimeOffFormChange("singleDay", e.target.checked)}
            className={`rounded accent-blue-600 ${isEditMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          />
          Single Day
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Start Time</label>
            <input
              type="time"
              value={timeOffForm.startTime}
              onChange={(e) => handleTimeOffFormChange("startTime", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">End Time</label>
            <input
              type="time"
              value={timeOffForm.endTime}
              onChange={(e) => handleTimeOffFormChange("endTime", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="border-t border-slate-100" />

      {/* Reason */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500">Reason</label>
        <input
          type="text"
          value={timeOffForm.reason}
          onChange={(e) => handleTimeOffFormChange("reason", e.target.value)}
          placeholder="e.g., Vacation, Sick Leave, Personal"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

    </div>

    {/* Footer */}
    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
      <button
        onClick={handleCloseAddTimeOffDialog}
        disabled={isSubmittingTimeOff}
        className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={isEditMode ? handleUpdateTimeOff : handleCreateTimeOff}
        disabled={isSubmittingTimeOff}
        className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmittingTimeOff
          ? isEditMode ? "Updating..." : "Adding..."
          : isEditMode ? "Update" : "Add"}
      </button>
    </div>

  </DialogContent>
</Dialog>

      {/* ── Update Status Dialog ── */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent showCloseButton={false} className="max-w-md w-full rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Booking Status</DialogTitle>
            <DialogDescription>
              Select a new status for this booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {(["Active", "Finalized", "Cancelled", "No Show"] as const).map((status) => (
              <button
                key={status}
                onClick={async () => {
                  setSelectedStatus(status);
                  await handleUpdateBookingEntry(status, true);
                  setShowStatusDialog(false);
                }}
                disabled={loadingCalendar}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${selectedStatus === status
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
                    : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{status}</span>
                {selectedStatus === status && (
                  loadingCalendar ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )
                )}
              </button>
            ))}
          </div>

          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setShowStatusDialog(false)}
              disabled={loadingCalendar}
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
