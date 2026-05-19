"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CalendarDays, Clock, Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { sileo } from "sileo";

/* =========================================================
   TYPES
========================================================= */

type BusinessHour = {
  DayOfWeek: string;
  StartTime: string;
  EndTime: string;
  TimeIncrement: number;
};

type BookingPlanningPeriod = {
  Code: string;
  Description: string;
  BookingSetupCode: string;
  DateFrom: string;
  DateTo: string;
  Active: string;
};

type SettingsSection = "general" | "business-hours" | "planning-period";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_BOOKING_SETUP_CODE = "MAIN";

const toTimeInputValue = (time?: string) => {
  if (!time) return "";
  const cleaned = time.trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  if (cleaned.includes("PM") && hours < 12) hours += 12;
  if (cleaned.includes("AM") && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

/* =========================================================
   SIDEBAR NAV ITEMS
========================================================= */

const navItems: { id: SettingsSection; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "general",
    label: "General",
    icon: <Pencil className="h-4 w-4" />,
    description: "Branch general settings",
  },
  {
    id: "business-hours",
    label: "Business Hours",
    icon: <Clock className="h-4 w-4" />,
    description: "Manage daily schedules",
  },
  {
    id: "planning-period",
    label: "Planning Period",
    icon: <CalendarDays className="h-4 w-4" />,
    description: "Booking date ranges",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [bookingSetupCode, setBookingSetupCode] = useState("");
  const [selectedTeamDescription, setSelectedTeamDescription] = useState("");

  const [branchDescription, setBranchDescription] = useState("");
  const [address, setAddress] = useState("");
  const [timeSlotBookableCount, setTimeSlotBookableCount] = useState("");
  const [timeIncrementMinutes, setTimeIncrementMinutes] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [allowableTime, setAllowableTime] = useState("");
  const [generalSubmitting, setGeneralSubmitting] = useState(false);
  const [showGeneralConfirm, setShowGeneralConfirm] = useState(false);

  /* ================= BUSINESS HOURS STATE ================= */

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);
  const [hourAction, setHourAction] = useState<"create" | "update">("create");
  const [hourSubmitting, setHourSubmitting] = useState(false);

  const [day, setDay] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [interval, setInterval] = useState("");

  /* ================= PLANNING PERIOD STATE ================= */

  const [planning, setPlanning] = useState<BookingPlanningPeriod[]>([]);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [planningAction, setPlanningAction] = useState<"create" | "update">("create");
  const [planningSubmitting, setPlanningSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ================= FETCH ================= */

  const fetchBusinessHours = useCallback(async () => {
    if (!bookingSetupCode) return;
    try {
      setLoadingHours(true);
      const res = await fetch("/api/business-hours/get-booking-business-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode }),
      });
      const json = await res.json();
      setBusinessHours(json || []);
    } catch {
      sileo.error({ title: "Failed to load business hours", fill: "#171717" });
    } finally {
      setLoadingHours(false);
    }
  }, [bookingSetupCode]);

  const fetchPlanningPeriods = useCallback(async () => {
    if (!bookingSetupCode) return;
    try {
      const res = await fetch("/api/booking-planning-period/get-booking-planning-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode }),
      });
      const json = await res.json();
      setPlanning(json || []);
    } catch {
      sileo.error({ title: "Failed to load planning periods", fill: "#171717" });
    }
  }, [bookingSetupCode]);

  const fetchSelectedTeamDescription = useCallback(async () => {
    if (!bookingSetupCode) {
      setSelectedTeamDescription("");
      setBranchDescription("");
      setAddress("");
      setTimeSlotBookableCount("");
      setTimeIncrementMinutes("");
      setCurrencyCode("");
      setCurrencySymbol("");
      setAllowableTime("");
      return;
    }

    try {
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${encodeURIComponent(bookingSetupCode)}`);
      const json = await res.json();
      const selected = Array.isArray(json) ? json[0] : json;

      setSelectedTeamDescription(selected?.BookingSetupDescription || selected?.Description || bookingSetupCode);
      setBranchDescription(selected?.BookingSetupDescription || selected?.Description || "");
      setAddress(
        selected?.BookingSetupAddress ||
        selected?.BookingSetupLocationCode ||
        selected?.Location ||
        ""
      );
      setTimeSlotBookableCount(
        String(
          selected?.BookingSetupTimeSlotBookableCount ??
          selected?.TimeSlotBookableCount ??
          ""
        )
      );
      setTimeIncrementMinutes(
        String(
          selected?.BookingSetupTimeIncrement ??
          selected?.TimeIncrement ??
          ""
        )
      );
      setCurrencyCode(selected?.BookingSetupCurrencyCode || selected?.CurrencyCode || "");
      setCurrencySymbol(selected?.BookingSetupCurrencySymbol || selected?.CurrencySymbol || "");
      setAllowableTime(
        String(
          selected?.BookingSetupAllowableTime ??
          selected?.AllowableTime ??
          ""
        )
      );
    } catch {
      setSelectedTeamDescription(bookingSetupCode);
    }
  }, [bookingSetupCode]);

  useEffect(() => {
    const storedCode = window.localStorage.getItem("selectedBookingSetupCode");
    setBookingSetupCode(storedCode ?? DEFAULT_BOOKING_SETUP_CODE);
  }, []);

  const saveGeneralSettings = async () => {
    try {
      setGeneralSubmitting(true);
      const res = await fetch("/api/booking-branch-setup/update-booking-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          description: branchDescription,
          locationCode: address,
          timeIncrement: String(timeIncrementMinutes) || "0",
          closingAllowableTime: String(allowableTime) || "0",
          timeSlotBookableCount: String(timeSlotBookableCount) || "0",
          currencyCode,
          currencySymbol
        }),
      });

      if (!res.ok) throw new Error();
      sileo.success({ title: "General settings saved", fill: "#171717" });
      await fetchSelectedTeamDescription();
    } catch {
      sileo.error({ title: "Failed to save general settings", fill: "#171717" });
    } finally {
      setGeneralSubmitting(false);
    }
  };

  useEffect(() => {
    if (!bookingSetupCode) return;
    fetchBusinessHours();
    fetchPlanningPeriods();
    fetchSelectedTeamDescription();
  }, [bookingSetupCode, fetchBusinessHours, fetchPlanningPeriods, fetchSelectedTeamDescription]);

  /* ================= BUSINESS HOURS ACTIONS ================= */

  const resetHourForm = () => { setDay(""); setStart(""); setEnd(""); setInterval(""); };

  const openCreateHour = () => { resetHourForm(); setHourAction("create"); setHourOpen(true); };

  const openUpdateHour = (row: BusinessHour) => {
    setHourAction("update");
    setDay(row.DayOfWeek);
    setStart(toTimeInputValue(row.StartTime));
    setEnd(toTimeInputValue(row.EndTime));
    setInterval(String(row.TimeIncrement || ""));
    setHourOpen(true);
  };

  const createHour = async () => {
    try {
      setHourSubmitting(true);
      const res = await fetch("/api/business-hours/create-booking-business-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingBusinessHoursDayOfWeek: day,
          bookingBusinessHoursStartTime: start,
          bookingBusinessHoursEndTime: end,
          bookingBusinessHoursTimeIncrement: interval,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Business hours created", fill: "#171717" });
      await fetchBusinessHours();
      setHourOpen(false);
      resetHourForm();
    } catch {
      sileo.error({ title: "Failed to create business hours", fill: "#171717" });
    } finally {
      setHourSubmitting(false);
    }
  };

  const updateHour = async () => {
    try {
      setHourSubmitting(true);
      const res = await fetch("/api/business-hours/update-booking-business-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingBusinessHoursDayOfWeek: day,
          bookingBusinessHoursStartTime: start,
          bookingBusinessHoursEndTime: end,
          bookingBusinessHoursTimeIncrement: interval,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Business hours updated", fill: "#171717" });
      await fetchBusinessHours();
      setHourOpen(false);
    } catch {
      sileo.error({ title: "Failed to update business hours", fill: "#171717" });
    } finally {
      setHourSubmitting(false);
    }
  };

  const deleteHour = async (d: string) => {
    const confirmed = confirm("Delete this business hour schedule?");
    if (!confirmed) return;
    try {
      const res = await fetch("/api/business-hours/delete-booking-business-hour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode, bookingBusinessHoursDayOfWeek: d }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Business hours deleted", fill: "#171717" });
      await fetchBusinessHours();
    } catch {
      sileo.error({ title: "Failed to delete business hours", fill: "#171717" });
    }
  };

  const businessHourColumns: ColumnDef<BusinessHour>[] = useMemo(() => [
    { accessorKey: "DayOfWeek", header: "Day" },
    { accessorKey: "StartTime", header: "Start" },
    { accessorKey: "EndTime", header: "End" },
    { accessorKey: "TimeIncrement", header: "Interval (min)" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openUpdateHour(row.original)}
            className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteHour(row.original.DayOfWeek)}
            className="rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], []);

  /* ================= PLANNING PERIOD ACTIONS ================= */
  const toDateInputValue = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const resetPlanningForm = () => { setCode(""); setDescription(""); setDateFrom(""); setDateTo(""); };

  const openCreatePlanning = () => { resetPlanningForm(); setPlanningAction("create"); setPlanningOpen(true); };

  const openUpdatePlanning = (row: BookingPlanningPeriod) => {
    setPlanningAction("update");
    setCode(row.Code);
    setDescription(row.Description);
    setDateFrom(toDateInputValue(row.DateFrom));
    setDateTo(toDateInputValue(row.DateTo));
    setPlanningOpen(true);
  };

  const createPlanning = async () => {
    try {
      setPlanningSubmitting(true);
      const res = await fetch("/api/booking-planning-period/create-booking-planning-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode, code, description, dateFrom, dateTo }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Planning period created", fill: "#171717" });
      await fetchPlanningPeriods();
      setPlanningOpen(false);
      resetPlanningForm();
    } catch {
      sileo.error({ title: "Failed to create planning period", fill: "#171717" });
    } finally {
      setPlanningSubmitting(false);
    }
  };

  const updatePlanning = async () => {
    try {
      setPlanningSubmitting(true);
      const res = await fetch("/api/booking-planning-period/update-booking-planning-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode, code, description, dateFrom, dateTo }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Planning period updated", fill: "#171717" });
      await fetchPlanningPeriods();
      setPlanningOpen(false);
    } catch {
      sileo.error({ title: "Failed to update planning period", fill: "#171717" });
    } finally {
      setPlanningSubmitting(false);
    }
  };

  const toggleActive = async (row: BookingPlanningPeriod) => {
    const endpoint =
      row.Active === "Yes"
        ? "/api/booking-planning-period/set-booking-planning-period-inactive"
        : "/api/booking-planning-period/set-booking-planning-period-active";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingSetupCode, code: row.Code }),
    });
    sileo.success({ title: "Planning period updated", fill: "#171717" });
    await fetchPlanningPeriods();
  };

  const deletePlanning = async (c: string) => {
    const confirmed = confirm("Delete this planning period?");
    if (!confirmed) return;
    try {
      const res = await fetch("/api/booking-planning-period/delete-booking-planning-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode, code: c }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Planning period deleted", fill: "#171717" });
      await fetchPlanningPeriods();
    } catch {
      sileo.error({ title: "Failed to delete planning period", fill: "#171717" });
    }
  };

  const planningColumns: ColumnDef<BookingPlanningPeriod>[] = useMemo(() => [
    { accessorKey: "Code", header: "Code" },
    { accessorKey: "Description", header: "Description" },
    { accessorKey: "DateFrom", header: "From" },
    { accessorKey: "DateTo", header: "To" },
    {
      accessorKey: "Active",
      header: "Active",
      cell: ({ row }) => (
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={row.original.Active === "Yes"}
              onChange={() => toggleActive(row.original)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${row.original.Active === "Yes" ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${row.original.Active === "Yes" ? "translate-x-4" : ""}`} />
          </div>
        </label>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openUpdatePlanning(row.original)}
            className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deletePlanning(row.original.Code)}
            className="rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], []);

  /* ================= UI ================= */

  const activeNav = navItems.find((n) => n.id === activeSection)!;

  return (
    <>
      {/* TOP HEADER */}
      <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>
                Settings
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* SETTINGS LAYOUT — padded container so the card floats on the bg */}
      <div className="h-[calc(100vh-4rem)] bg-gray-100 p-6 overflow-hidden">
        <div className="flex h-full rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* SETTINGS SIDEBAR */}
          <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-100">
              <h1 className="text-sm font-semibold text-gray-900">{selectedTeamDescription ? ` ${selectedTeamDescription}` : ""} Branch</h1>
              <p className="text-xs text-gray-400 mt-0.5">Manage configurations</p>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all ${isActive
                        ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                      }`}
                  >
                    <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* SETTINGS CONTENT */}
          <main className="flex-1 overflow-auto bg-white">
            <div className="px-8 py-7">

              {/* ====== GENERAL SECTION ====== */}
              {activeSection === "general" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">General</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Edit branch general settings</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowGeneralConfirm(true)}
                      disabled={generalSubmitting}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generalSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>

                  <div className="grid gap-4 rounded-lg border border-gray-100 bg-white p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label>Code</Label>
                        <Input value={bookingSetupCode} readOnly />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Input
                          value={branchDescription}
                          onChange={(e) => setBranchDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Address</Label>
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Time Slot Bookable Count</Label>
                        <Input
                          type="number"
                          value={timeSlotBookableCount}
                          onChange={(e) => setTimeSlotBookableCount(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Time Increment (Minutes)</Label>
                        <Input
                          type="number"
                          value={timeIncrementMinutes}
                          onChange={(e) => setTimeIncrementMinutes(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Currency Code</Label>
                        <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Currency Symbol</Label>
                        <Input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== BUSINESS HOURS SECTION ====== */}
              {activeSection === "business-hours" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Business Hours</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Set start/end times per day of week</p>
                      </div>
                    </div>
                    <button
                      onClick={openCreateHour}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Hours
                    </button>
                  </div>

                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    {loadingHours ? (
                      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                        Loading...
                      </div>
                    ) : (
                      <DataTable columns={businessHourColumns} data={businessHours} />
                    )}
                  </div>
                </div>
              )}

              {/* ====== PLANNING PERIOD SECTION ====== */}
              {activeSection === "planning-period" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Planning Period</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Define booking date ranges and activate them</p>
                      </div>
                    </div>
                    <button
                      onClick={openCreatePlanning}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Period
                    </button>
                  </div>

                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <DataTable columns={planningColumns} data={planning} />
                  </div>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>

      <Dialog open={showGeneralConfirm} onOpenChange={setShowGeneralConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm business hours update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm text-slate-600">
            <p>
              When you update the time increment, the business-hours intervals will be recalculated to match the new increment. Existing business hours may change accordingly.
            </p>
            <p>Do you want to continue?</p>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowGeneralConfirm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setShowGeneralConfirm(false);
                await saveGeneralSettings();
              }}
              disabled={generalSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generalSubmitting ? "Saving..." : "Confirm"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== BUSINESS HOURS DIALOG ====== */}
      <Dialog open={hourOpen} onOpenChange={setHourOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hourAction === "create" ? "Add Business Hours" : "Edit Business Hours"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Day of Week</Label>
              <Select
                value={day}
                onValueChange={(value) => setDay(value ?? "")}
                disabled={hourAction === "update"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>End Time</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Interval (minutes)</Label>
              <Input
                type="number"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setHourOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={hourAction === "create" ? createHour : updateHour}
              disabled={hourSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {hourSubmitting ? "Saving..." : hourAction === "create" ? "Create" : "Update"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== PLANNING PERIOD DIALOG ====== */}
      <Dialog open={planningOpen} onOpenChange={setPlanningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {planningAction === "create" ? "Add Planning Period" : "Edit Planning Period"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. Q1-2025"
                disabled={planningAction === "update"}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. First Quarter Bookings"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setPlanningOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={planningAction === "create" ? createPlanning : updatePlanning}
              disabled={planningSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {planningSubmitting ? "Saving..." : planningAction === "create" ? "Create" : "Update"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}