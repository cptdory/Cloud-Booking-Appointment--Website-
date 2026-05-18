"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  MapPin,
  Briefcase,
  Users,
  Calendar,
  User,
  Clock,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Home,
  FileText,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { sileo } from "sileo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionUser {
  name: string;
  email: string;
  role: string;
  booking_setup_code: string;
  staff_code?: string;
  is_admin?: boolean;
  customer_number?: string;
  phone_number?: string;
  address?: string;
  address2?: string;
}

interface CustomerData {
  CustomerNo: string;
  Name: string;
  Name2?: string;
  PhoneNo?: string;
  EMail?: string;
  Address?: string;
  Address2?: string;
  Age?: string;
  BirthDate?: string;
}

interface Branch {
  code: string;
  description: string;
}

interface Service {
  id: string;
  code: string;
  name: string;
  duration: string;
  price: string;
}

interface Staff {
  staffId: string;
  staffCode: string;
  staffName: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
}

interface Timeslot {
  id: string;
  time: string;
  availability: string;
  allowBooking: string;
}

interface DateObj {
  day: number;
  month: number;
  year: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SILEO_FILL = "#171717";

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-full shrink-0 transition-all duration-150 ${
        selected
          ? "border-[5px] border-blue-600 bg-white"
          : "border-2 border-blue-200 bg-transparent"
      }`}
    />
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
        selected
          ? "border-blue-600 bg-[#eff6ff] shadow-[0_2px_12px_rgba(37,99,235,.12)]"
          : "border-blue-200 bg-[#f8faff] hover:border-blue-400"
      }`}
    >
      {children}
    </div>
  );
}

function FormCard({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_16px_rgba(59,130,246,0.08)]">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-8 h-8 rounded-[9px] bg-[#eff6ff] flex items-center justify-center text-blue-600 shrink-0">
            {icon}
          </div>
          <h2 className="text-[#1e3a5f] font-extrabold text-[15px] sm:text-[17px] m-0">
            {title}
          </h2>
        </div>
        {sub && <p className="text-[#93b4d6] text-[13px] m-0 ml-[42px]">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[#4b6fa3] text-[11px] font-bold tracking-[.8px] uppercase">
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookNowPage() {
  // ── Session ──────────────────────────────────────────────────────────────────
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setSessionUser(d.user ?? null))
      .catch(console.error);
  }, []);

  const isCustomerRole = sessionUser?.role === "customer";

  // ── Reschedule ───────────────────────────────────────────────────────────────
  const rescheduleEntryNo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("reschedule") ?? ""
      : "";
  const isRescheduling = !!rescheduleEntryNo;

  const [isLoadingReschedule, setIsLoadingReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<any>(null);

  // ── Steps ────────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(isRescheduling ? 4 : 1);

  // ── Loading states ───────────────────────────────────────────────────────────
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingTimeslots, setLoadingTimeslots] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);

  // ── Selections ───────────────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateObj | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [skipAvailabilityCheck, setSkipAvailabilityCheck] = useState("false");
  const [allowPreviousDate, setAllowPreviousDate] = useState(false);

  // ── Customer form ────────────────────────────────────────────────────────────
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress1, setCustomerAddress1] = useState("");
  const [customerAddress2, setCustomerAddress2] = useState("");
  const [notes, setNotes] = useState("");

  // ── Calendar ─────────────────────────────────────────────────────────────────
  const [calendarDate, setCalendarDate] = useState(new Date());
  const today = new Date();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedBranchObj =
    branches.find((b) => b.code === selectedBranch) ??
    (isRescheduling && rescheduleData
      ? { code: rescheduleData.BookingSetupCode ?? "", description: rescheduleData.BookingSetupCode ?? "" }
      : undefined);

  const selectedServiceObj =
    services.find((s) => s.id === selectedService) ??
    (isRescheduling && rescheduleData
      ? { id: selectedService, code: rescheduleData.ServiceCode ?? "", name: rescheduleData.ServiceName ?? "", duration: "", price: "" }
      : undefined);

  // ── Auto-fill customer for customer role ─────────────────────────────────────
  useEffect(() => {
    if (!isCustomerRole || !sessionUser) return;
    setSelectedCustomer({
      CustomerNo: sessionUser.customer_number ?? "",
      Name: sessionUser.name ?? "",
      Name2: "",
      PhoneNo: sessionUser.phone_number ?? "",
      EMail: sessionUser.email ?? "",
      Address: sessionUser.address ?? "",
      Address2: sessionUser.address2 ?? "",
    });
    setCustomerName(sessionUser.name ?? "");
    setCustomerEmail(sessionUser.email ?? "");
    setCustomerPhone(sessionUser.phone_number ?? "");
    setCustomerAddress1(sessionUser.address ?? "");
    setCustomerAddress2(sessionUser.address2 ?? "");
  }, [sessionUser, isCustomerRole]);

  // ─── canProceed ───────────────────────────────────────────────────────────────
  const canProceed = () => {
    if (isRescheduling) {
      if (currentStep === 4) return selectedDate !== null && selectedTime !== "";
      return true;
    }
    if (currentStep === 1) return selectedBranch !== "";
    if (currentStep === 2) return selectedService !== "";
    if (currentStep === 3) return selectedStaff !== "" && selectedRoom !== "";
    if (currentStep === 4) return selectedDate !== null && selectedTime !== "";
    if (currentStep === 5) {
      if (isCustomerRole) return true;
      if (isNewCustomer) return customerName !== "" && customerEmail !== "";
      return selectedCustomer !== null;
    }
    return true;
  };

  const resetSubsequentSteps = (stepNumber: number) => {
    if (isRescheduling) return;
    if (stepNumber < 2) { setSelectedService(""); setSelectedStaff(""); setSelectedRoom(""); setSelectedDate(null); setSelectedTime(""); }
    else if (stepNumber < 3) { setSelectedStaff(""); setSelectedRoom(""); setSelectedDate(null); setSelectedTime(""); }
    else if (stepNumber < 4) { setSelectedDate(null); setSelectedTime(""); }
  };

  const handleStepChange = (n: number) => { setCurrentStep(n); resetSubsequentSteps(n); };
  const handleSelectBranch = (code: string) => { setSelectedBranch(code); resetSubsequentSteps(1); };
  const handleSelectService = (id: string) => { setSelectedService(id); resetSubsequentSteps(2); };
  const handleSelectStaff = (id: string) => { setSelectedStaff(id); resetSubsequentSteps(3); };
  const handleSelectRoom = (id: string) => { setSelectedRoom(id); resetSubsequentSteps(3); };
  const handleSelectDate = (d: DateObj) => setSelectedDate(d);
  const handleSelectTime = (t: string) => setSelectedTime(t);

  // ─── API calls ────────────────────────────────────────────────────────────────

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch("/api/booking-branch-setup/get-booking-setup-list");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setBranches(list.map((b: any) => ({ code: b.Code, description: b.Description })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchServices = useCallback(async () => {
    if (!selectedBranchObj?.code) return;
    try {
      setLoadingServices(true);
      const res = await fetch(
        `/api/booking-branch-setup/get-booking-setup?code=${selectedBranchObj.code}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const servicesParam = list[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 1);
      setServices(
        servicesParam?.BookingParameterValue?.map((s: any) => ({
          id: String(s.BookingParameterValueId),
          code: s.BookingParameterValueCode,
          name: s.BookingParameterValueDescription,
          duration: `${Math.round(s.BookingParameterValueDuration / 60)} hr/s`,
          price: s.BookingParameterValuePrice || "0",
        })) ?? []
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingServices(false);
    }
  }, [selectedBranchObj?.code]);

  const fetchStaff = useCallback(async () => {
    if (!selectedBranchObj?.code || !selectedService) return;
    try {
      setLoadingStaff(true);
      const res = await fetch("/api/booking-staff-rela/get-booking-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode: selectedBranchObj.code, serviceId: selectedService }),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAssignedStaff(
        list.map((s: any) => ({
          staffId: String(s.StaffId),
          staffCode: s.StaffCode,
          staffName: s.StaffName,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStaff(false);
    }
  }, [selectedBranchObj?.code, selectedService]);

  const fetchRooms = useCallback(async () => {
    if (!selectedBranchObj?.code) return;
    try {
      setLoadingRooms(true);
      const res = await fetch(
        `/api/booking-branch-setup/get-booking-setup?code=${selectedBranchObj.code}`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const roomsParam = list[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 3);
      setRooms(
        roomsParam?.BookingParameterValue?.map((r: any) => ({
          id: String(r.BookingParameterValueId),
          code: r.BookingParameterValueCode,
          name: r.BookingParameterValueDescription,
        })) ?? []
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  }, [selectedBranchObj?.code]);

  const fetchTimeslots = useCallback(async () => {
    if (!selectedDate || !selectedBranchObj?.code) return;
    try {
      setLoadingTimeslots(true);
      const formattedDate = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${String(selectedDate.year).slice(-2)}`;
      const res = await fetch("/api/available-timeslot/get-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selectedBranchObj.code,
          bookingDate: formattedDate,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selectedStaff}|${selectedService}|${selectedRoom}`,
          skipTimeSlotAvailabilityCheck: skipAvailabilityCheck,
        }),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTimeslots(
        list.map((sl: any) => ({
          id: sl.Id,
          time: new Date(`1970-01-01T${sl.Time}`).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          availability: sl.IsAvailable,
          allowBooking: sl.AllowBooking,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTimeslots(false);
    }
  }, [selectedDate, selectedBranchObj?.code, selectedStaff, selectedService, selectedRoom, skipAvailabilityCheck]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customer/get-customers");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCustomerList(
        list.map((c: any) => ({
          CustomerNo: c.CustomerNo,
          Name: c.Name,
          Name2: c.Name2,
          PhoneNo: c.PhoneNo,
          EMail: c.EMail,
          Address: c.Address,
          Address2: c.Address2,
          Age: c.Age,
          BirthDate: c.BirthDate,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const loadRescheduleData = async (entryNo: string) => {
    setIsLoadingReschedule(true);
    try {
      const res = await fetch("/api/booking-entry/get-booking-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingEntryNo: entryNo }),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const entry = list[0];
      if (!entry) throw new Error("Booking entry not found");

      setRescheduleData(entry);

      const paramMap: Record<string, any> = {};
      (entry.BookingParameters || []).forEach((p: any) => {
        paramMap[p.BookingParameterCode] = p;
      });

      const serviceId = String(paramMap["SERVICE"]?.BookingParameterValueId ?? paramMap["SERVICES"]?.BookingParameterValueId ?? "");
      const staffId = String(paramMap["STAFF"]?.BookingParameterValueId ?? "");
      const roomId = String(paramMap["ROOM"]?.BookingParameterValueId ?? "");

      setSelectedBranch(entry.BookingSetupCode ?? "");
      setSelectedService(serviceId);
      setSelectedStaff(staffId);
      setSelectedRoom(roomId);
      setSelectedCustomer({
        CustomerNo: entry.CustomerNo ?? "",
        Name: entry.Name ?? "",
        Name2: entry.Name2 ?? "",
        PhoneNo: entry.PhoneNo ?? "",
        EMail: entry.EMail ?? "",
        Address: entry.Address ?? "",
        Address2: entry.Address2 ?? "",
      });
      setCustomerName(entry.Name ?? "");
      setCustomerEmail(entry.EMail ?? "");
      setCustomerPhone(entry.PhoneNo ?? "");
      setCustomerAddress1(entry.Address ?? "");
      setCustomerAddress2(entry.Address2 ?? "");
      setNotes(entry.BookingNote ?? "");
      handleSelectDate({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() });

      sileo.info({ title: "Booking loaded. Only Date & Time can be changed.", fill: SILEO_FILL });
    } catch (err: any) {
      sileo.error({ title: err?.message || "Failed to load booking entry.", fill: SILEO_FILL });
    } finally {
      setIsLoadingReschedule(false);
    }
  };

  const handleBookAvailableTimeslot = async () => {
    if (!selectedDate || !selectedTime) {
      sileo.error({ title: "Please select both a date and time", fill: SILEO_FILL });
      return;
    }

    const finalName = isCustomerRole ? (sessionUser?.name ?? "") : isNewCustomer ? customerName : (selectedCustomer?.Name || "");
    const finalEmail = isCustomerRole ? (sessionUser?.email ?? "") : isNewCustomer ? customerEmail : (selectedCustomer?.EMail || "");
    const finalPhone = isCustomerRole ? (sessionUser?.phone_number ?? "") : isNewCustomer ? customerPhone : (selectedCustomer?.PhoneNo || "");
    const finalAddress1 = isCustomerRole ? (sessionUser?.address ?? "") : isNewCustomer ? customerAddress1 : (selectedCustomer?.Address || "");
    const finalAddress2 = isCustomerRole ? (sessionUser?.address2 ?? "") : isNewCustomer ? customerAddress2 : (selectedCustomer?.Address2 || "");

    if (!finalName) {
      sileo.error({ title: "Full Name is required", fill: SILEO_FILL });
      return;
    }

    setIsBookingLoading(true);
    try {
      const formattedDate = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${selectedDate.year}`;
      const res = await fetch("/api/available-timeslot/book-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selectedBranchObj?.code || "",
          bookingDate: formattedDate,
          bookingStartTime: selectedTime,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selectedStaff}|${selectedService}|${selectedRoom}`,
          bookingNote: notes,
          bookingEntryNo: isRescheduling ? rescheduleEntryNo : "",
          customerNoOrEmailAdd: finalEmail,
          customerName: finalName,
          customerPhoneNo: finalPhone,
          customerBirthDate: "",
          customerAddress1: finalAddress1,
          customerAddress2: finalAddress2,
          skipTimeSlotAvailabilityCheck: skipAvailabilityCheck,
        }),
      });

      if (!res.ok) throw new Error("Booking failed");

      sileo.success({ title: "Booking confirmed successfully!", fill: SILEO_FILL });

      if (isRescheduling) {
        window.location.href = "/book-now";
        return;
      }

      // Reset
      setCurrentStep(1);
      setSelectedBranch("");
      setSelectedService("");
      setSelectedStaff("");
      setSelectedRoom("");
      setSelectedDate(null);
      setSelectedTime("");
      setNotes("");
      if (!isCustomerRole) {
        setSelectedCustomer(null);
        setIsNewCustomer(false);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress1("");
        setCustomerAddress2("");
      }
      fetchBranches();
    } catch {
      sileo.error({ title: "Booking failed. Please try again.", fill: SILEO_FILL });
    } finally {
      setIsBookingLoading(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { if (!isCustomerRole) fetchCustomers(); }, [isCustomerRole]);
  useEffect(() => { if (selectedBranch) fetchServices(); }, [selectedBranch]);
  useEffect(() => { if (selectedService && selectedBranch) fetchStaff(); }, [selectedService]);
  useEffect(() => { if (selectedStaff && selectedBranch) fetchRooms(); }, [selectedStaff]);
  useEffect(() => { if (selectedDate) fetchTimeslots(); }, [selectedDate, selectedStaff, selectedService, selectedRoom, skipAvailabilityCheck]);
  useEffect(() => {
    if (currentStep === 4 && !selectedDate) {
      handleSelectDate({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() });
    }
  }, [currentStep]);
  useEffect(() => {
    if (!allowPreviousDate && selectedDate) {
      const selectedDateValue = new Date(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day
      );
      const todayValue = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      if (selectedDateValue < todayValue) {
        setSelectedDate({
          day: today.getDate(),
          month: today.getMonth(),
          year: today.getFullYear(),
        });
        setSelectedTime("");
      }
    }
  }, [
    allowPreviousDate,
    selectedDate,
    today.getDate(),
    today.getMonth(),
    today.getFullYear(),
  ]);
  useEffect(() => {
    if (rescheduleEntryNo) loadRescheduleData(rescheduleEntryNo);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{isRescheduling ? "Reschedule Booking" : "Book Now"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Reschedule loading overlay */}
      {isLoadingReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white border border-blue-100 rounded-2xl px-10 py-8 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[#1e3a5f] font-bold text-sm">Loading booking details…</p>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 p-3 sm:p-6">
        <div className="font-sans">
          {/* Progress Bar */}
          <div className="bg-white border border-blue-100 rounded-2xl px-4 sm:px-8 py-[22px] mb-6 shadow-[0_2px_16px_rgba(59,130,246,0.08)]">
            {isRescheduling && (
              <div className="flex items-center justify-center gap-2 mb-3 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl px-4 py-2">
                <span>🔄</span>
                <span>Rescheduling — only Date &amp; Time can be changed</span>
              </div>
            )}
            <div className="flex items-center justify-center">
              {["Branch", "Service", "Details", "Date & Time", "Customer"].map((step, idx) => {
                const n = idx + 1;
                const isLockedStep = isRescheduling && n !== 4;
                const done = isRescheduling ? n !== 4 : n < currentStep;
                const active = n === currentStep;
                const canClick = done || active;
                return (
                  <div key={step} className={`flex items-center ${idx < 4 ? "flex-1" : ""}`}>
                    <div
                      onClick={() => !isLockedStep && canClick && handleStepChange(n)}
                      className={`flex flex-col items-center gap-1 sm:gap-2 ${
                        !isLockedStep && canClick ? "cursor-pointer" : "cursor-not-allowed"
                      } ${isLockedStep ? "opacity-60" : ""}`}
                    >
                      <div
                        className={`rounded-full flex items-center justify-center transition-all duration-300
                          ${active ? "w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] border-[3px] border-blue-200 ring-4 ring-blue-50 scale-105" : "w-[34px] h-[34px] sm:w-[42px] sm:h-[42px]"}
                          ${done || active ? "bg-gradient-to-br from-blue-600 to-blue-400" : "bg-[#eef4ff] border-2 border-blue-200"}
                        `}
                      >
                        {done ? (
                          <CheckCircle2 size={active ? 20 : 16} color="white" />
                        ) : (
                          <span className={`font-bold text-xs sm:text-sm ${active ? "text-white" : "text-blue-300"}`}>{n}</span>
                        )}
                      </div>
                      <span className={`hidden sm:block text-[11px] ${active ? "font-bold" : "font-medium"} ${done || active ? "text-blue-600" : "text-blue-300"}`}>
                        {step}
                      </span>
                    </div>
                    {idx < 4 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 sm:mx-1.5 mb-0 sm:mb-[26px] rounded-sm transition-all duration-300 ${
                          done ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-[#e2edf9]"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
            <div className="flex flex-col gap-[18px] order-2 lg:order-1">

              {/* ── Step 1: Branch ── */}
              {currentStep === 1 && (
                <FormCard icon={<MapPin size={17} />} title="Step 1: Choose Your Branch" sub={isRescheduling ? "Branch is locked during rescheduling" : "Select the location most convenient for you"}>
                  {isRescheduling ? (
                    <div className="flex items-center gap-3 border-2 border-blue-200 bg-[#f0f7ff] rounded-xl p-4 opacity-80 cursor-not-allowed select-none">
                      <div className="w-[18px] h-[18px] rounded-full border-[5px] border-blue-600 bg-white shrink-0" />
                      <div className="flex-1">
                        <div className="text-[#1e3a5f] font-bold text-[15px]">{rescheduleData?.BookingSetupCode}</div>
                        <div className="text-[#93b4d6] text-[13px] mt-0.5">Locked — cannot change branch during reschedule</div>
                      </div>
                      <CheckCircle2 size={20} className="text-blue-400" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {loadingBranches
                        ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)
                        : branches.map((b) => (
                            <OptionCard key={b.code} selected={selectedBranch === b.code} onClick={() => handleSelectBranch(b.code)}>
                              <RadioDot selected={selectedBranch === b.code} />
                              <div className="flex-1">
                                <div className="text-[#1e3a5f] font-bold text-[15px]">{b.code}</div>
                                <div className="text-[#93b4d6] text-[13px] mt-0.5">{b.description}</div>
                              </div>
                              {selectedBranch === b.code && <CheckCircle2 size={20} className="text-blue-600" />}
                            </OptionCard>
                          ))}
                    </div>
                  )}
                </FormCard>
              )}

              {/* ── Step 2: Service ── */}
              {currentStep === 2 && (
                <FormCard icon={<Briefcase size={17} />} title="Step 2: Select Service" sub={isRescheduling ? "Service is locked during rescheduling" : "Choose the service you'd like to book"}>
                  {isRescheduling ? (
                    <div className="flex items-center gap-3 border-2 border-blue-200 bg-[#f0f7ff] rounded-xl p-4 opacity-80 cursor-not-allowed select-none">
                      <div className="w-[18px] h-[18px] rounded-full border-[5px] border-blue-600 bg-white shrink-0" />
                      <div className="flex-1">
                        <div className="text-[#1e3a5f] font-bold text-[15px]">{rescheduleData?.ServiceName}</div>
                        <div className="text-[#93b4d6] text-[13px] mt-0.5">Locked — cannot change service during reschedule</div>
                      </div>
                      <CheckCircle2 size={20} className="text-blue-400" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {loadingServices
                        ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)
                        : services.map((s) => (
                            <OptionCard key={s.id} selected={selectedService === s.id} onClick={() => handleSelectService(s.id)}>
                              <RadioDot selected={selectedService === s.id} />
                              <div className="flex-1">
                                <div className="text-[#1e3a5f] font-bold text-[15px]">{s.name}</div>
                                <div className="flex gap-3.5 mt-1">
                                  <span className="text-[#93b4d6] text-[13px]">⏱ {s.duration}</span>
                                </div>
                              </div>
                              {selectedService === s.id && <CheckCircle2 size={20} className="text-blue-600" />}
                            </OptionCard>
                          ))}
                    </div>
                  )}
                </FormCard>
              )}

              {/* ── Step 3: Staff & Room ── */}
              {currentStep === 3 && (
                <FormCard icon={<Users size={17} />} title="Step 3: Select Staff & Options" sub={isRescheduling ? "Staff & room are locked during rescheduling" : "Choose your preferred staff member and room"}>
                  {isRescheduling ? (
                    <div className="flex flex-col gap-3">
                      <SectionLabel>Staff Member</SectionLabel>
                      <div className="flex items-center gap-3 border-2 border-blue-200 bg-[#f0f7ff] rounded-xl p-4 opacity-80 cursor-not-allowed select-none">
                        <div className="w-[38px] h-[38px] rounded-full shrink-0 bg-gradient-to-br from-blue-400 to-blue-300 flex items-center justify-center text-[15px] font-extrabold text-white">
                          {(rescheduleData?.StaffName || rescheduleData?.StaffCode || "?")[0]}
                        </div>
                        <div className="flex-1">
                          <div className="text-[#1e3a5f] font-bold">{rescheduleData?.StaffCode}</div>
                          <div className="text-[#4b6fa3] text-xs">{rescheduleData?.StaffName}</div>
                        </div>
                        <CheckCircle2 size={20} className="text-blue-400" />
                      </div>
                      <div className="h-px bg-[#e2edf9]" />
                      <SectionLabel>Room</SectionLabel>
                      <div className="inline-flex items-center gap-2 border-2 border-blue-200 bg-[#f0f7ff] rounded-[10px] p-3 text-blue-600 font-bold text-[13px] opacity-80 cursor-not-allowed select-none">
                        <CheckCircle2 size={15} className="text-blue-400" />
                        {rescheduleData?.BookingParameters?.find((p: any) => p.BookingParameterCode === "ROOM")?.BookingParameterValueCode || "—"}
                      </div>
                      <p className="text-[#93b4d6] text-xs">Locked — cannot change staff or room during reschedule</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <SectionLabel>Staff Member</SectionLabel>
                      <div className="flex flex-col gap-2.5">
                        {loadingStaff
                          ? [1, 2].map((i) => <Skeleton key={i} className="h-14" />)
                          : assignedStaff.length === 0
                          ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-[10px] p-4 text-center">
                              <div className="text-[#b8860b] text-sm font-semibold">No staff assigned to this service</div>
                              <div className="text-[#8b7500] text-xs mt-1.5">Please contact support</div>
                            </div>
                          )
                          : assignedStaff.map((st) => (
                              <OptionCard key={st.staffId} selected={selectedStaff === st.staffId} onClick={() => handleSelectStaff(st.staffId)}>
                                <RadioDot selected={selectedStaff === st.staffId} />
                                <div className="w-[38px] h-[38px] rounded-full shrink-0 bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[15px] font-extrabold text-white">
                                  {st.staffName[0]}
                                </div>
                                <div className="flex-1">
                                  <div className="text-[#1e3a5f] font-bold">{st.staffCode}</div>
                                  <div className="text-[#4b6fa3] text-xs">{st.staffName}</div>
                                </div>
                              </OptionCard>
                            ))}
                      </div>

                      {selectedStaff && (
                        <>
                          <div className="h-px bg-[#e2edf9]" />
                          <SectionLabel>Room Type</SectionLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {loadingRooms
                              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)
                              : rooms.map((r) => (
                                  <div
                                    key={r.id}
                                    onClick={() => handleSelectRoom(r.id)}
                                    className={`border-2 rounded-[10px] p-3 text-center text-[13px] cursor-pointer transition-all ${
                                      selectedRoom === r.id
                                        ? "border-blue-600 bg-[#eff6ff] text-blue-600 font-bold"
                                        : "border-blue-200 bg-[#f8faff] text-[#4b6fa3] font-medium hover:border-blue-400"
                                    }`}
                                  >
                                    {r.name}
                                  </div>
                                ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </FormCard>
              )}

              {/* ── Step 4: Date & Time ── */}
              {currentStep === 4 && (
                <FormCard icon={<Calendar size={17} />} title="Step 4: Select Date & Time" sub="Pick your preferred appointment slot">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div>
                      <SectionLabel>Select Date</SectionLabel>
                      <div className="bg-[#f8faff] border border-blue-200 rounded-xl p-4 mt-2.5">
                        <div className="flex justify-between items-center mb-3.5">
                          <button
                            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                            className="bg-blue-50 text-blue-600 cursor-pointer px-2.5 py-1 rounded-md text-base font-bold hover:bg-blue-100 border-0"
                          >
                            ‹
                          </button>
                          <span className="text-[#1e3a5f] font-bold text-sm">
                            {MONTH_NAMES[month]} {year}
                          </span>
                          <button
                            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                            className="bg-blue-50 text-blue-600 cursor-pointer px-2.5 py-1 rounded-md text-base font-bold hover:bg-blue-100 border-0"
                          >
                            ›
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                            <div key={d} className="text-center text-[#93b4d6] text-[11px] font-bold py-1">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const isPast =
                            !allowPreviousDate &&
                            new Date(year, month, day) <
                              new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                          const isSel = selectedDate?.day === day && selectedDate?.month === month && selectedDate?.year === year;
                          return (
                              <div
                                key={day}
                                onClick={() => !isPast && (handleSelectDate({ day, month, year }), setSelectedTime(""))}
                                className={`text-center py-1.5 px-0.5 text-[13px] rounded-lg transition-all
                                  ${isPast ? "text-[#b5cce6] cursor-not-allowed" : "cursor-pointer"}
                                  ${isSel ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold" : ""}
                                  ${isToday && !isSel ? "bg-blue-50 text-blue-600 font-bold" : ""}
                                  ${!isPast && !isSel ? "hover:bg-blue-50" : ""}
                                `}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Timeslots */}
                    <div>
                      <SectionLabel>Available Time Slots</SectionLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2.5 max-h-[300px] overflow-y-auto pr-2">
                        {loadingTimeslots
                          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)
                          : timeslots.map((sl) => (
                              <button
                                key={sl.id}
                                disabled={sl.availability === "No" || sl.allowBooking === "No"}
                                onClick={() => sl.availability === "Yes" && handleSelectTime(sl.time)}
                                className={`py-2.5 px-1.5 rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1 transition-all
                                  ${selectedTime === sl.time
                                    ? "border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-[0_4px_12px_rgba(37,99,235,.25)]"
                                    : sl.availability === "Yes"
                                    ? "border border-blue-200 bg-white text-[#1e3a5f] hover:border-blue-400"
                                    : "border border-blue-100 bg-[#f1f5fb] text-[#b5cce6] cursor-not-allowed"
                                  }`}
                              >
                                <Clock size={11} />
                                {sl.time}
                                {(sl.availability === "No" || sl.allowBooking === "No") && (
                                  <span className="text-[9px] opacity-70">(Full)</span>
                                )}
                              </button>
                            ))}
                      </div>
                    </div>
                  </div>

                  {/* Skip availability check — hide for customer role */}
                  {!isCustomerRole && (
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-blue-100">
                      <label className="flex items-center gap-2 text-sm text-[#4b6fa3] font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          id="skipAvailabilityCheck"
                          checked={skipAvailabilityCheck === "true"}
                          onChange={(e) => setSkipAvailabilityCheck(e.target.checked ? "true" : "false")}
                          className="w-4 h-4 rounded border-blue-300 accent-blue-600 cursor-pointer"
                        />
                        <span>Book Anyway</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#4b6fa3] font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          id="allowPreviousDate"
                          checked={allowPreviousDate}
                          onChange={(e) => setAllowPreviousDate(e.target.checked)}
                          className="w-4 h-4 rounded border-blue-300 accent-blue-600 cursor-pointer"
                        />
                        <span>Allow Previous Date</span>
                      </label>
                    </div>
                  )}
                </FormCard>
              )}

              {/* ── Step 5: Customer ── */}
              {currentStep === 5 && (
                <>
                  <FormCard
                    icon={<User size={17} />}
                    title="Step 5: Customer Information"
                    sub={
                      isCustomerRole
                        ? "Your account details will be used for this booking"
                        : isRescheduling
                        ? "Customer is locked during rescheduling"
                        : "Select customer or add a new one"
                    }
                  >
                    {isCustomerRole ? (
                      <div className="flex flex-col gap-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center text-white font-extrabold text-base shrink-0">
                            {(sessionUser?.name || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-[#1e3a5f] font-bold text-[15px]">{sessionUser?.name || "—"}</div>
                            {sessionUser?.email && (
                              <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-1"><Mail size={11} />{sessionUser.email}</div>
                            )}
                            {sessionUser?.phone_number && (
                              <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-0.5"><Phone size={11} />{sessionUser.phone_number}</div>
                            )}
                            {sessionUser?.address && (
                              <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-0.5">
                                <Home size={11} />
                                {sessionUser.address}{sessionUser.address2 ? `, ${sessionUser.address2}` : ""}
                              </div>
                            )}
                          </div>
                          <CheckCircle2 size={20} className="text-blue-500 shrink-0" />
                        </div>
                        <p className="text-[#93b4d6] text-xs text-center">Your account details are used automatically</p>
                      </div>
                    ) : isRescheduling ? (
                      <div className="flex flex-col gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 opacity-90 cursor-not-allowed select-none">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center text-white font-extrabold text-base shrink-0">
                            {(rescheduleData?.Name || "?")[0]}
                          </div>
                          <div className="flex-1">
                            <div className="text-[#1e3a5f] font-bold text-[15px]">{rescheduleData?.Name || "—"}</div>
                            <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-1"><Mail size={11} />{rescheduleData?.EMail || "—"}</div>
                            {rescheduleData?.PhoneNo && (
                              <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-0.5"><Phone size={11} />{rescheduleData.PhoneNo}</div>
                            )}
                            {rescheduleData?.Address && (
                              <div className="flex items-center gap-1 text-[#4b6fa3] text-xs mt-0.5">
                                <Home size={11} />
                                {rescheduleData.Address}{rescheduleData.Address2 ? `, ${rescheduleData.Address2}` : ""}
                              </div>
                            )}
                          </div>
                          <CheckCircle2 size={20} className="text-blue-400 shrink-0" />
                        </div>
                        <p className="text-[#93b4d6] text-xs text-center">Locked — customer cannot be changed during reschedule</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="new_customer"
                            checked={isNewCustomer}
                            onChange={(e) => {
                              setIsNewCustomer(e.target.checked);
                              if (!e.target.checked) {
                                setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
                                setCustomerAddress1(""); setCustomerAddress2("");
                              }
                            }}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <Label htmlFor="new_customer" className="text-[#4b6fa3] text-sm font-bold cursor-pointer">New Customer</Label>
                        </div>

                        {!isNewCustomer && (
                          <div className="space-y-1.5">
                            <SectionLabel>Select Customer</SectionLabel>
                            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto">
                              {customerList.map((c) => (
                                <OptionCard key={c.CustomerNo} selected={selectedCustomer?.CustomerNo === c.CustomerNo} onClick={() => setSelectedCustomer(c)}>
                                  <RadioDot selected={selectedCustomer?.CustomerNo === c.CustomerNo} />
                                  <div className="flex-1">
                                    <div className="text-[#1e3a5f] font-bold text-[15px]">{c.Name}</div>
                                    <div className="text-[#93b4d6] text-[13px] mt-0.5">{c.EMail}</div>
                                  </div>
                                  {selectedCustomer?.CustomerNo === c.CustomerNo && <CheckCircle2 size={20} className="text-blue-600" />}
                                </OptionCard>
                              ))}
                            </div>
                          </div>
                        )}

                        {isNewCustomer && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-[#4b6fa3] text-[11px] font-bold tracking-[.5px] uppercase">Full Name *</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93b4d6] pointer-events-none"><User size={13} /></span>
                                <Input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter full name" className="pl-9 bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] focus-visible:ring-blue-300" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[#4b6fa3] text-[11px] font-bold tracking-[.5px] uppercase">Email Address</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93b4d6] pointer-events-none"><Mail size={13} /></span>
                                  <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Enter email" className="pl-9 bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] focus-visible:ring-blue-300" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[#4b6fa3] text-[11px] font-bold tracking-[.5px] uppercase">Phone Number</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93b4d6] pointer-events-none"><Phone size={13} /></span>
                                  <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter phone" className="pl-9 bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] focus-visible:ring-blue-300" />
                                </div>
                              </div>
                            </div>
                            <div className="h-px bg-[#e2edf9] my-1" />
                            <div className="space-y-1.5">
                              <Label className="text-[#4b6fa3] text-[11px] font-bold tracking-[.5px] uppercase">Address</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93b4d6] pointer-events-none"><Home size={13} /></span>
                                <Input type="text" value={customerAddress1} onChange={(e) => setCustomerAddress1(e.target.value)} placeholder="Enter address" className="pl-9 bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] focus-visible:ring-blue-300" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[#4b6fa3] text-[11px] font-bold tracking-[.5px] uppercase">Address Line 2</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93b4d6] pointer-events-none"><Home size={13} /></span>
                                <Input type="text" value={customerAddress2} onChange={(e) => setCustomerAddress2(e.target.value)} placeholder="Enter address line 2" className="pl-9 bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] focus-visible:ring-blue-300" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </FormCard>

                  <FormCard icon={<FileText size={17} />} title="Special Notes" sub="Any special requests or additional information">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any special requests, allergies, or notes for your appointment..."
                      className="min-h-[100px] bg-[#f8faff] border-blue-200 text-[#1e3a5f] text-sm rounded-[10px] resize-y focus-visible:ring-blue-300"
                    />
                  </FormCard>

                  <Button
                    onClick={handleBookAvailableTimeslot}
                    disabled={isBookingLoading || !canProceed()}
                    className="w-full py-[18px] h-auto bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white text-base font-bold rounded-2xl shadow-[0_8px_24px_rgba(37,99,235,.3)] flex items-center justify-center gap-2"
                  >
                    {isBookingLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        {isRescheduling ? "Confirm Reschedule" : "Confirm Booking"}
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Navigation */}
              {currentStep < 5 && (
                <div className="flex gap-3">
                  {currentStep > 1 && !(isRescheduling && currentStep === 4) && (
                    <Button
                      variant="outline"
                      onClick={() => handleStepChange(currentStep - 1)}
                      className="px-4 sm:px-[22px] py-3 h-auto border-blue-200 text-[#4b6fa3] text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <ChevronLeft size={15} /> Back
                    </Button>
                  )}
                  <Button
                    disabled={!canProceed()}
                    onClick={() => canProceed() && handleStepChange(currentStep + 1)}
                    className={`ml-auto px-4 sm:px-[26px] py-3 h-auto rounded-[10px] text-sm font-bold flex items-center gap-1.5 transition-all ${
                      canProceed()
                        ? "bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white shadow-[0_4px_16px_rgba(37,99,235,.25)]"
                        : "bg-[#f1f5fb] text-[#b5cce6] cursor-not-allowed"
                    }`}
                  >
                    Continue <ChevronRight size={15} />
                  </Button>
                </div>
              )}
            </div>

            {/* ── Booking Summary Sidebar ── */}
            <div className="sticky top-6 order-1 lg:order-2">
              <div className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-6 shadow-[0_2px_16px_rgba(59,130,246,0.08)]">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-[#e2edf9]">
                  <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} color="white" />
                  </div>
                  <span className="text-[#1e3a5f] font-extrabold text-base">Booking Summary</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-3">
                  {[
                    { icon: <MapPin size={13} />, label: "Branch", value: selectedBranchObj?.code, sub: selectedBranchObj?.description },
                    { icon: <Briefcase size={13} />, label: "Service", value: selectedServiceObj?.name, sub: selectedServiceObj?.duration },
                    { icon: <Users size={13} />, label: "Staff", value: assignedStaff.find((s) => s.staffId === selectedStaff)?.staffName || (isRescheduling && rescheduleData?.StaffName) || null, sub: null },
                    { icon: <Home size={13} />, label: "Room", value: rooms.find((r) => r.id === selectedRoom)?.name || null, sub: null },
                    { icon: <Calendar size={13} />, label: "Date", value: selectedDate ? `${MONTH_NAMES[selectedDate.month]} ${selectedDate.day}, ${selectedDate.year}` : null, sub: null },
                    { icon: <Clock size={13} />, label: "Time", value: selectedTime || null, sub: null },
                    {
                      icon: <User size={13} />,
                      label: "Customer",
                      value: isCustomerRole ? (sessionUser?.name || null) : isNewCustomer ? customerName || null : selectedCustomer?.Name || null,
                      sub: isCustomerRole ? sessionUser?.email : isNewCustomer ? customerEmail : selectedCustomer?.EMail,
                    },
                  ].map((item) => (
                    <div key={item.label} className="py-2.5 sm:py-3 border-b border-[#e2edf9] last:border-b-0">
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0 flex items-center justify-center mt-px ${item.value ? "bg-blue-50 text-blue-600" : "bg-[#f1f5fb] text-[#c7ddf5]"}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#93b4d6] text-[10px] tracking-[.8px] font-bold mb-0.5 uppercase">{item.label}</div>
                          {item.value ? (
                            <>
                              <div className="text-[#1e3a5f] text-xs sm:text-sm font-semibold truncate">{item.value}</div>
                              {item.sub && <div className="text-[#93b4d6] text-[11px] truncate">{item.sub}</div>}
                            </>
                          ) : (
                            <div className="text-[#c7ddf5] text-[12px] italic">Not selected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
