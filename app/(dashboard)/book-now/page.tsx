"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2, MapPin, Briefcase, Users, Calendar, User, Clock,
  Phone, Mail, FileText, RefreshCw, ChevronLeft, ChevronRight, X,
  Stethoscope, ArrowRight, Sparkles, Clock10Icon, Home,
} from "lucide-react";
import { sileo } from "sileo";
import { usePathname } from "next/navigation";
import { usePageActivation } from "@/hooks/use-page-activation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
}
interface Branch { code: string; description: string, address: string }
interface Service { id: string; code: string; name: string; duration: string; price: string }
interface Staff { staffId: string; staffCode: string; staffName: string, isAvailable: boolean; }
interface Timeslot { id: string; time: string; availability: boolean; allowBooking: boolean }
interface DateObj { day: number; month: number; year: number }

// ─── Utilities ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const formatDurationLabel = (minutes: number) => {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const formatPriceLabel = (value: number | string) => {
  const price = Number(value);
  return Number.isNaN(price) ? "₱0.00" : `₱${price.toFixed(2)}`;
};
const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg style={{ width: size, height: size }} className="animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Reusable form primitives ─────────────────────────────────────────────────
const FieldInput = ({ icon: Icon, className = "", ...props }: { icon?: React.ComponentType<any>; className?: string;[key: string]: any }) => (
  <div className="relative">
    {Icon && <Icon size={14} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
    <input
      className={`w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
        focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100
        disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
        placeholder:text-slate-300 transition-all ${className}`}
      {...props}
    />
  </div>
);
const FieldTextarea = ({ className = "", ...props }: { className?: string;[key: string]: any }) => (
  <textarea
    className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
      focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100
      disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
      placeholder:text-slate-300 resize-none transition-all ${className}`}
    {...props}
  />
);
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">{children}</label>
);

// ─── Step badge ───────────────────────────────────────────────────────────────
function StepBadge({ number, done, active }: { number: number; done: boolean; active: boolean }) {
  if (done) return (
    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
      <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
    </div>
  );
  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all
      ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-100 text-slate-400"}`}>
      {number}
    </div>
  );
}

// ─── Horizontal Setup Card ────────────────────────────────────────────────────
function HorizontalSetupCard({ step, currentStep, title, icon: Icon, children, id, disabled, readonlyValue, readonlySub, readonlySub2 }: {
  step: number; currentStep: number; title: string; icon: React.ComponentType<any>; children: React.ReactNode; id?: string; disabled?: boolean; readonlyValue?: string; readonlySub?: string; readonlySub2?: string;
}) {
  const done = currentStep > step;
  const active = currentStep === step;
  return (
    <div id={id} className={`flex-1 rounded-2xl border transition-all duration-300
      ${disabled ? "border-slate-100 bg-slate-50/60 opacity-60 pointer-events-none" : ""}
      ${!disabled && active ? "border-blue-200 bg-white shadow-md shadow-blue-50" : ""}
      ${!disabled && done ? "border-blue-100 bg-blue-50/40" : ""}
      ${!disabled && !active && !done ? "border-slate-100 bg-slate-50/60 opacity-50" : ""}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-inherit">
        <StepBadge number={step} done={!disabled && done} active={!disabled && active} />
        <Icon size={12} strokeWidth={2} className={active || done ? "text-blue-600" : "text-slate-400"} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${active || done ? "text-blue-700" : "text-slate-400"}`}>{title}</span>
        {!disabled && active && <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Select</span>}
        {!disabled && done && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
        {disabled && <span className="ml-auto text-[9px] font-bold bg-slate-200 text-slate-400 px-1.5 py-0.5 rounded-full">Locked</span>}
      </div>
      <div className="px-3 py-2.5">
        {disabled && readonlyValue ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-sm text-slate-600 flex-1">{readonlyValue}</span>
            </div>
            {readonlySub2 && <div className="px-1 text-xs text-slate-500">{readonlySub2}</div>}
          </div>
        ) : children}
      </div>
    </div>
  );
}
// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, loading, data, isRescheduling }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean; data: any; isRescheduling: boolean;
}) {
  if (!open) return null;
  const { branch, service, staff, date, time, name, email, phone, notes } = data;
  const rows = [
    { icon: User, label: "Professional", value: staff },
    { icon: User, label: "Patient", value: name },
    { icon: Mail, label: "Email", value: email },
    { icon: Phone, label: "Phone", value: phone },
    { icon: FileText, label: "Notes", value: notes },
  ].filter((r) => Boolean(r.value));
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <CheckCircle2 size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {isRescheduling ? "Confirm Reschedule" : "Confirm Booking"}
                </h2>
                <p className="text-xs text-slate-400">Review your appointment details</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X size={16} strokeWidth={2.5} className="text-slate-500" />
            </button>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 mb-4 text-white">
            <div className="flex items-center gap-2 mb-3 opacity-80">
              <Stethoscope size={14} strokeWidth={2} />
              <span className="text-xs font-semibold uppercase tracking-wider">Appointment</span>
            </div>
            <div className="text-xl font-bold mb-1">{service ?? "—"}</div>
            <div className="text-sm opacity-80 mb-3">{branch ?? "—"}</div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg">
                <Calendar size={13} strokeWidth={2} />
                <span className="font-semibold">{date ?? "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg">
                <Clock size={13} strokeWidth={2} />
                <span className="font-semibold">{time ?? "—"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-0 mb-5 rounded-2xl border border-slate-100 overflow-hidden">
            {rows.map((row: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <row.icon size={13} strokeWidth={2} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{row.label}</div>
                  <div className="text-sm font-semibold text-slate-700">{row.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-colors">
              Go back
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-2xl
                transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                : <><CheckCircle2 size={15} strokeWidth={2.5} /> Confirm</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile progress ──────────────────────────────────────────────────────────
function MobileProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = ["Location", "Service", "Staff", "Date & Time", "Customer"];
  const capped = Math.min(currentStep, totalSteps);
  const stepIndex = Number.isInteger(capped) && capped >= 1 && capped <= steps.length ? capped - 1 : 0;
  return (
    <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500">Step {capped > 0 ? capped : 1} of {totalSteps}</span>
        <span className="text-xs font-semibold text-blue-600">{steps[stepIndex]}</span>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentStep ? "bg-blue-600" : "bg-slate-100"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Timeslot Panel ───────────────────────────────────────────────────────────
function TimeslotPanel({ selectedDate, timeslots, loading, selectedTime, onSelectTime, stepNumber, currentStep, skipAvailabilityCheck, onSkipAvailabilityCheckChange, isCustomerRole, noStaffAvailable, contactNumber }: {
  selectedDate: DateObj | null; timeslots: Timeslot[]; loading: boolean; selectedTime: string;
  onSelectTime: (t: string) => void; stepNumber: number; currentStep: number; skipAvailabilityCheck: string; onSkipAvailabilityCheckChange?: (checked: boolean) => void; isCustomerRole?: boolean; noStaffAvailable?: boolean; contactNumber?: string;
}) {
  const slots = timeslots || [];
  const selectedSlot = slots.find((ts) => ts.time === selectedTime) ?? null;
  const bypass = skipAvailabilityCheck === "true";
  const selectedSlotWarning = Boolean(selectedSlot?.availability && !selectedSlot?.allowBooking && !bypass);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <StepBadge number={stepNumber} done={currentStep > stepNumber} active={currentStep === stepNumber} />
        <Clock10Icon size={13} strokeWidth={2} className={currentStep >= stepNumber ? "text-blue-600" : "text-slate-400"} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStep >= stepNumber ? "text-blue-700" : "text-slate-400"}`}>Pick a Time</span>
        {currentStep === stepNumber && <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Select</span>}
        {currentStep > stepNumber && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {noStaffAvailable && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-6">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-bold">No staff available for this service</div>
                <div className="text-[12px] text-amber-800 mt-1">
                  Please contact us for assistance{contactNumber ? ':' : '.'}
                </div>
                {contactNumber && (
                  <a href={`tel:${contactNumber.replace(/\s+/g, '')}`} className="mt-2 inline-flex items-center gap-2 text-amber-900 font-semibold text-sm">
                    <span className="text-lg">📞</span>
                    <span className="underline">{contactNumber}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
            <Calendar size={32} strokeWidth={1.2} className="mb-3" />
            <p className="text-xs font-semibold text-slate-400">Select a date</p>
            <p className="text-[11px] text-slate-300 mt-1">to see available slots</p>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 text-center mb-3">Fetching slots…</p>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <RefreshCw size={24} strokeWidth={1.5} className="mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No slots available</p>
            <p className="text-[11px] text-slate-300 mt-1">No time slots were returned for this date.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((ts) => {
                const isSelected = selectedTime === ts.time;
                const isWarning = !bypass && ts.availability && !ts.allowBooking;
                const isDisabled = !bypass && !ts.availability && !ts.allowBooking;
                return (
                  <button key={ts.id} type="button" onClick={() => !isDisabled && onSelectTime(ts.time)} disabled={isDisabled}
                    className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition-all border
                      ${isSelected
                        ? isWarning
                          ? "bg-amber-400 border-amber-500 text-amber-950 shadow-md shadow-amber-200 scale-[1.02]"
                          : "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.02]"
                        : isDisabled
                          ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                          : isWarning
                            ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                      }`}>
                    {ts.time}
                  </button>
                );
              })}
            </div>
            {selectedSlotWarning && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                The selected time slot does not have enough available time to accommodate the full duration of the selected service.
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex min-h-[4.5rem] items-center border-t border-slate-100 px-3 py-3">
        {!isCustomerRole && onSkipAvailabilityCheckChange ? (
          <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer">
            <input type="checkbox" checked={skipAvailabilityCheck === "true"}
              onChange={e => onSkipAvailabilityCheckChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
            Open All Time Slots
          </label>
        ) : (
          <div className="text-[11px] text-slate-300">
            Select a time slot to continue.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BookNowPage() {
  // ── Session ────────────────────────────────────────────────────────────────
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then(r => r.json()).then(d => setSessionUser(d.user ?? null)).catch(console.error);
  }, []);
  const isCustomerRole = sessionUser?.role === "customer";

  // ── Reschedule ─────────────────────────────────────────────────────────────
  const rescheduleEntryNo = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("reschedule") ?? "" : "";
  const isRescheduling = !!rescheduleEntryNo;
  const [isLoadingReschedule, setIsLoadingReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<any>(null);

  // ── Tour ───────────────────────────────────────────────────────────────────

  // ── Loading ────────────────────────────────────────────────────────────────
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingTimeslots, setLoadingTimeslots] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [orgSetupLoading, setOrgSetupLoading] = useState(false);
  const [contactNumber, setContactNumber] = useState("");
  const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

  // ── Data ───────────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // ── Selections ─────────────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  
  const [selectedDate, setSelectedDate] = useState<DateObj | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [skipAvailabilityCheck, setSkipAvailabilityCheck] = useState("false");
  const [allowPreviousDate, setAllowPreviousDate] = useState(false);

  // ── Customer form ──────────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress1, setCustomerAddress1] = useState("");
  const [customerAddress2, setCustomerAddress2] = useState("");
  const [notes, setNotes] = useState("");

  // ── OTP / confirm ──────────────────────────────────────────────────────────
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [mobilePanel, setMobilePanel] = useState("select");
  const today = new Date();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedBranchObj = branches.find(b => b.code === selectedBranch) ??
    (isRescheduling && rescheduleData ? { code: rescheduleData.BookingSetupCode ?? "", description: rescheduleData.BookingSetupCode ?? "" } : undefined);
  const selectedServiceObj = services.find(s => s.id === selectedService) ??
    (isRescheduling && rescheduleData ? { id: selectedService, code: "", name: rescheduleData.ServiceName ?? "", duration: "", price: "" } : undefined);
  const selectedStaffObj = assignedStaff.find(s => s.staffId === selectedStaff) ?? null;
  const selectedTimeslot = timeslots.find(ts => ts.time === selectedTime) ?? null;
  const selectedTimeWarning = (skipAvailabilityCheck === "true") ? false : Boolean(selectedTimeslot?.availability && !selectedTimeslot?.allowBooking);
  const noStaffAvailable = Boolean(
    selectedService &&
    assignedStaff.length === 1 &&
    !loadingStaff &&
    ((assignedStaff[0].staffCode === "ANY" && assignedStaff[0].staffName === "Any/No Preference") || !assignedStaff[0].isAvailable)
  );

  // Effective customer info
  const effectiveName = isCustomerRole ? (sessionUser?.name ?? "") : isNewCustomer ? customerName : (selectedCustomer?.Name ?? "");
  const effectiveEmail = isCustomerRole ? (sessionUser?.email ?? "") : isNewCustomer ? customerEmail : (selectedCustomer?.EMail ?? "");
  const effectivePhone = isCustomerRole ? (sessionUser?.phone_number ?? "") : isNewCustomer ? customerPhone : (selectedCustomer?.PhoneNo ?? "");
  const effectiveAddr1 = isCustomerRole ? (sessionUser?.address ?? "") : isNewCustomer ? customerAddress1 : (selectedCustomer?.Address ?? "");
  const effectiveAddr2 = isCustomerRole ? (sessionUser?.address2 ?? "") : isNewCustomer ? customerAddress2 : (selectedCustomer?.Address2 ?? "");

  // Step logic — reschedule jumps straight to date/time (step 4)
  const currentStep = isRescheduling
    ? (!selectedDate || !selectedTime || selectedTimeWarning) ? 4 : 5
    : !selectedBranch ? 1
      : !selectedService ? 2
        : (!selectedStaff) ? 3
          : (!selectedDate || !selectedTime || selectedTimeWarning) ? 4
            : 5;

  const hasEmailOrExistingCustomer = isRescheduling ? true : (effectiveEmail !== "" || (!!selectedCustomer && !!selectedCustomer.CustomerNo));
  const isFormValid =
    effectiveName !== "" &&
    hasEmailOrExistingCustomer &&
    selectedTime !== "" &&
    (isRescheduling
      ? true
      : !isCustomerRole
        ? (isNewCustomer ? true : selectedCustomer !== null)
        : true);

  const filteredCustomers = customerList.filter((c) =>
    c.Name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.EMail ?? "").toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.PhoneNo ?? "").toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.CustomerNo.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const pathname = usePathname();

  // ── Auto-fill customer for customer role ───────────────────────────────────
  useEffect(() => {
    if (!isCustomerRole || !sessionUser) return;
    setSelectedCustomer({ CustomerNo: sessionUser.customer_number ?? "", Name: sessionUser.name ?? "", PhoneNo: sessionUser.phone_number ?? "", EMail: sessionUser.email ?? "", Address: sessionUser.address ?? "", Address2: sessionUser.address2 ?? "" });
  }, [sessionUser, isCustomerRole]);

  // ── Mobile tab auto-advance ────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep >= 4) setMobilePanel("schedule");
    if (currentStep >= 5) setMobilePanel("details");
  }, [currentStep]);

  // ── Auto-select today when reaching date step ──────────────────────────────
  useEffect(() => {
    if (currentStep >= 4 && !selectedDate && (selectedStaff || isRescheduling)) {
      const d = new Date();
      setSelectedDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
  }, [currentStep, selectedStaff, isRescheduling, selectedDate]);

  // ── Auto-select today when service selected with no preference ────────────

  // ── Prevent past date if not allowed ──────────────────────────────────────
  useEffect(() => {
    if (!allowPreviousDate && selectedDate) {
      const sel = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
      const tod = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (sel < tod) { setSelectedDate({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() }); setSelectedTime(""); }
    }
  }, [allowPreviousDate]);

  useEffect(() => {
    if (!isCustomerRole && !selectedBranch && branches.length > 0) {
      const storedCode = window.localStorage.getItem("selectedBookingSetupCode") ?? "";
      const match = branches.find((b) => b.code === storedCode);
      if (match) {
        setSelectedBranch(match.code);
      }
    }
  }, [branches, isCustomerRole, selectedBranch]);

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch("/api/booking-branch-setup/get-booking-setup-list", { cache: "no-store" });
      const d = await res.json();
      const branchList = (Array.isArray(d) ? d : []).map((b: any) => ({ code: String(b.Code ?? ""), description: String(b.Description ?? ""), address: String(b.Address ?? "") }));
      setBranches(branchList);
    } catch (_) { } finally { setLoadingBranches(false); }
  };
  const fetchOrgSetup = async () => {
    try {
      setOrgSetupLoading(true);
      const res = await fetch(`/api/booking-organization-setup?tenantId=${tenantId}`, { cache: "no-store" });
      const d = await res.json();
      setContactNumber(d?.MobileNumber ?? "");
    } catch (_) { } finally { setOrgSetupLoading(false); }
  };
  const selectedBranchData = branches.find(
    (b: any) => b.code === selectedBranch
  );
  const fetchServices = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      setLoadingServices(true);
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selectedBranch}`, { cache: "no-store" });
      const d = await res.json();
      const list = Array.isArray(d) ? d : [];
      const p = list[0]?.BookingParameter?.find((x: any) => x.BookingParameterId === 1);
      setServices((p?.BookingParameterValue ?? []).map((s: any) => ({
        id: String(s.BookingParameterValueId ?? ""),
        code: String(s.BookingParameterValueCode ?? ""),
        name: String(s.BookingParameterValueDescription ?? ""),
        duration: formatDurationLabel(Number(s.BookingParameterValueDuration ?? 0)),
        price: formatPriceLabel(Number(s.BookingParameterValuePrice ?? 0)),
      })));
    } catch (_) { } finally { setLoadingServices(false); }
  }, [selectedBranch]);

  const fetchTimeslots = useCallback(async () => {
    if (!selectedDate || !selectedBranch) return;

    try {
      setLoadingTimeslots(true);
      setLoadingStaff(true);

      const fullYear =
        String(selectedDate.year).length === 2
          ? `20${selectedDate.year}`
          : selectedDate.year;

      const fmt = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(
        selectedDate.day
      ).padStart(2, "0")}/${fullYear}`;

      const res = await fetch(
        "/api/available-timeslot-v2/get-available-timeslot-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchCode: selectedBranch,
            bookingDate: fmt,
            serviceId: selectedService,
            staffId: (selectedStaff === "0" || selectedStaff === "") ? "" : selectedStaff,
            isUserLogin: sessionUser?.role === 'user' ? "true" : "false",
          }),
        }
      );

      const d = await res.json();
      // TIMESLOTS
      setTimeslots(
        (Array.isArray(d?.TimeSlots) ? d.TimeSlots : []).map((sl: any) => ({
          id: String(sl.Id ?? ""),
          time: new Date(`1970-01-01T${sl.Time}`).toLocaleTimeString(
            "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          ),
          availability: Boolean(sl.IsAvailable),
          allowBooking: Boolean(sl.AllowBooking),
        }))
      );
      const fetchedStaff = (Array.isArray(d?.ServiceStaffs) ? d.ServiceStaffs : []).map((s: any) => ({
        staffId: String(s.StaffId ?? ""),
        staffCode: String(s.StaffCode ?? ""),
        staffName: String(s.StaffName ?? ""),
        isAvailable: Boolean(s.IsAvailable),
      }));
      setAssignedStaff(fetchedStaff);
      // If sentinel '0' or no selection, default to first returned staff
      if ((selectedStaff === "0" || !selectedStaff) && fetchedStaff.length > 0) {
        setSelectedStaff(fetchedStaff[0].staffId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeslots(false);
      setLoadingStaff(false);
    }
  }, [
    selectedDate,
    selectedBranch,
    selectedStaff,
    selectedService,
    sessionUser,
  ]);

  const fetchCustomers = async () => {
    if (isCustomerRole) return;
    try {
      setLoadingCustomers(true);
      const res = await fetch("/api/customer/get-customers", { cache: "no-store" });
      const d = await res.json();
      setCustomerList((Array.isArray(d) ? d : []).map((c: any) => ({
        CustomerNo: c.CustomerNo, Name: c.Name, Name2: c.Name2,
        PhoneNo: c.PhoneNo, EMail: c.EMail, Address: c.Address, Address2: c.Address2,
      })));
    } catch (_) { } finally { setLoadingCustomers(false); }
  };

  const loadRescheduleData = async (entryNo: string) => {
    setIsLoadingReschedule(true);
    try {
      const res = await fetch("/api/booking-entry/get-booking-entry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingEntryNo: entryNo }),
      });
      const data = await res.json();
      console.log("Reschedule data:", data);
      const list = Array.isArray(data) ? data : [];
      const entry = list[0];
      if (!entry) throw new Error("Booking entry not found");
      setRescheduleData(entry);
      const paramMap: Record<string, any> = {};
      (entry.BookingParameters || []).forEach((p: any) => { paramMap[p.BookingParameterCode] = p; });
      const serviceId = String(paramMap["SERVICES"]?.BookingParameterValueId ?? "");
      const staffId = String(paramMap["STAFF"]?.BookingParameterValueId ?? "");
      const hasStaff = staffId !== "";
      setSelectedBranch(entry.BookingSetupCode ?? "");
      setSelectedService(serviceId);
      setSelectedStaff(staffId);
      setSelectedCustomer({ CustomerNo: entry.CustomerNo ?? "", Name: entry.Name ?? "", PhoneNo: entry.PhoneNo ?? "", EMail: entry.EMail ?? "", Address: entry.Address ?? "", Address2: entry.Address2 ?? "" });
      setCustomerName(entry.Name ?? "");
      setCustomerEmail(entry.EMail ?? "");
      setCustomerPhone(entry.PhoneNo ?? "");
      setCustomerAddress1(entry.Address ?? "");
      setCustomerAddress2(entry.Address2 ?? "");
      setNotes(entry.BookingNote ?? "");
      const bookingDate = new Date(entry.BookingStartDate);

      setSelectedDate({
        day: bookingDate.getDate(),
        month: bookingDate.getMonth(),
        year: bookingDate.getFullYear(),
      });
      sileo.info({ title: "Booking loaded. Only Date & Time can be changed.", fill: "#171717" });
    } catch (err: any) {
      sileo.error({ title: err?.message || "Failed to load booking entry.", fill: "#171717" });
    } finally { setIsLoadingReschedule(false); }
  };

  // ── Book button → open confirm directly ───────────────────────────────────
  const handleConfirmOpen = () => {
    const ok = Boolean(effectiveEmail) || Boolean(selectedCustomer) || isCustomerRole || isRescheduling;
    if (!ok) { sileo.error({ title: "Email is required or select an existing customer", fill: "#171717" }); return; }
    setConfirmDialogOpen(true);
  };

  // ── Booking submit ─────────────────────────────────────────────────────────
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !effectiveName || !(effectiveEmail || (selectedCustomer && selectedCustomer.CustomerNo))) return;
    setIsBookingLoading(true);
    try {
      const fmt = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${selectedDate.year}`;
      const autoSkip = (skipAvailabilityCheck === "true" || (selectedTimeslot?.availability && !selectedTimeslot?.allowBooking)) ? "true" : "false";
      const res = await fetch("/api/available-timeslot-v2/book-available-timeslot-v2", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode: selectedBranch,
          bookingDate: fmt,
          startTime: selectedTime,
          serviceId: selectedService,
          staffid: (selectedStaff === "0" || selectedStaff === "") ? "" : selectedStaff,
          isUserLogin: sessionUser?.role === 'user' ? "true" : "false",
          bookingNote: notes,
          bookingEntryNo: isRescheduling ? rescheduleEntryNo : "",
          customerNoOrEmailAdd: selectedCustomer?.CustomerNo ?? effectiveEmail,
          customerName: effectiveName,
          customerPhoneNo: effectivePhone,
          customerBirthDate: "",
          customerAddress1: effectiveAddr1,
          customerAddress2: effectiveAddr2,
          skipTimeSlotAvailabilityCheck: autoSkip,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setConfirmDialogOpen(false);
      sileo.success({ title: isRescheduling ? "Reschedule confirmed!" : "Booking confirmed successfully!", fill: "#171717" });
      if (isRescheduling) { window.location.href = "/book-now"; return; }
      // Reset
      setSelectedBranch(""); setSelectedService(""); setSelectedStaff("");
      setSelectedDate(null); setSelectedTime(""); setSelectedCustomer(null); setIsNewCustomer(false);
      setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setCustomerAddress1(""); setCustomerAddress2(""); setNotes("");
      setSkipAvailabilityCheck("false");
      setMobilePanel("select"); fetchBranches();
    } catch (e) { sileo.error({ title: e instanceof Error ? e.message : "Booking failed. Please try again.", fill: "#171717" }); }
    finally { setIsBookingLoading(false); }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const sel = {
    branch: (v: string) => { setSelectedBranch(v); setSelectedService(""); setSelectedStaff(""); setSelectedDate(null); setSelectedTime(""); setTimeslots([]); },
    service: (v: string) => { setSelectedService(v); setSelectedStaff("0"); setSelectedDate(null); setSelectedTime(""); setTimeslots([]); },
    staff: (v: string) => { setSelectedStaff(v); setSelectedTime(""); setTimeslots([]); if (currentStep < 4) setSelectedDate(null); },
    date: (d: DateObj) => { setSelectedDate(d); setSelectedTime(""); setTimeslots([]); },
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchBranches(); fetchCustomers(); fetchOrgSetup(); }, [pathname]);
  useEffect(() => { if (selectedBranch) fetchServices(); }, [selectedBranch, fetchServices]);
  useEffect(() => { if (selectedDate && selectedBranch && selectedService && selectedStaff) fetchTimeslots(); }, [selectedDate, selectedBranch, selectedStaff, selectedService, fetchTimeslots]);
  useEffect(() => { if (rescheduleEntryNo) loadRescheduleData(rescheduleEntryNo); }, []);
  useEffect(() => { if (rescheduleEntryNo && rescheduleData && selectedDate && selectedBranch && selectedService && selectedStaff) fetchTimeslots(); }, [selectedDate, selectedBranch, selectedService, selectedStaff, rescheduleData, fetchTimeslots]);

  // ── Confirm data ───────────────────────────────────────────────────────────
  usePageActivation(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSessionUser(d.user ?? null))
      .catch(console.error);

    fetchBranches();
    fetchCustomers();

    if (selectedBranch) fetchServices();
    if (selectedDate && selectedBranch && selectedService && selectedStaff) {
      fetchTimeslots();
    }
    if (rescheduleEntryNo) {
      loadRescheduleData(rescheduleEntryNo);
    }
  });

  const confirmData = {
    branch: selectedBranchObj?.description ?? selectedBranch,
    service: selectedServiceObj?.name ?? "",
    staff: selectedStaffObj?.staffName ?? (rescheduleData?.StaffName ?? ""),
    date: selectedDate ? `${MONTH_NAMES[selectedDate.month]} ${selectedDate.day}, ${selectedDate.year}` : "",
    time: selectedTime,
    name: effectiveName,
    email: effectiveEmail,
    phone: effectivePhone,
    notes,
  };

  // ── Calendar day renderer (shared) ────────────────────────────────────────
  const renderCalendarDay = (day: number) => {
    const isPast = !allowPreviousDate && new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSel = selectedDate?.day === day && selectedDate?.month === month && selectedDate?.year === year;
    const hasTime = isSel && !!selectedTime;
    const isDisabled = isPast || (!selectedStaff && !isRescheduling);
    return (
      <button key={day} disabled={isDisabled}
        onClick={() => !isDisabled && sel.date({ day, month, year })}
        className={`aspect-square flex items-center justify-center text-xs rounded-xl transition-all relative
          ${isPast ? "text-slate-200 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}
          ${isSel ? "!bg-blue-600 !text-white font-bold shadow-md shadow-blue-200" : ""}
          ${isToday && !isSel ? "font-bold text-blue-600 ring-2 ring-blue-200 ring-offset-1" : (!isSel ? "text-slate-600" : "")}`}>
        {day}
        {hasTime && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
      </button>
    );
  };

  // ── Staff panel (shared between desktop + mobile) ─────────────────────────
  const staffPanelContent = (
    <div className="space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><User size={14} strokeWidth={2} /></div>
        <select
          value={selectedStaff || ""}
          onChange={e => sel.staff(e.target.value)}
          disabled={!selectedService || loadingStaff}
          className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {loadingStaff ? "Loading…" : "Choose staff"}
          </option>

          {assignedStaff.map(st => (
            <option
              key={st.staffId}
              value={st.staffId}
            >
              {Number(st.staffId) === 0 ? "🟠" : (st.isAvailable ? "🟢" : "🔴")}{st.staffName} 
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer px-1">
        {/* No Preference removed — staff must be selected */}
        <span className="text-xs text-slate-600">Choose a professional</span>
      </label>
    </div>
  );

  // ── Admin-only controls (allow prev date only — Book Anyway moved to TimeslotPanel) ────────────────────────────
  const adminControlsCalendar = !isCustomerRole ? (
    <div className="flex min-h-[4.5rem] items-center py-3">
      <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer">
        <input type="checkbox" checked={allowPreviousDate}
          onChange={e => setAllowPreviousDate(e.target.checked)}
          className="w-3.5 h-3.5 accent-blue-600 cursor-pointer" />
        Allow Previous Date
      </label>
    </div>
  ) : (
    <div className="flex min-h-[4.5rem] items-center py-3 text-[11px] text-slate-300">
      Choose a date to view open times.
    </div>
  );

  // ── Customer panel ─────────────────────────────────────────────────────────
  const customerPanel = (
    <div className="space-y-3">
      {isCustomerRole ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(sessionUser?.name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-700 truncate">{sessionUser?.name}</div>
            <div className="text-xs text-slate-400 truncate">{sessionUser?.email}</div>
          </div>
          <CheckCircle2 size={16} className="text-blue-500 shrink-0" strokeWidth={2.5} />
        </div>
      ) : isRescheduling ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 opacity-75 cursor-not-allowed">
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(rescheduleData?.Name || "?")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-600 truncate">{rescheduleData?.Name}</div>
            <div className="text-xs text-slate-400 truncate">{rescheduleData?.EMail}</div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">Locked</span>
        </div>
      ) : (
        <>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isNewCustomer}
              onChange={e => {
                const checked = e.target.checked;
                setIsNewCustomer(checked);
                if (checked) {
                  setSelectedCustomer(null);
                } else {
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                  setCustomerAddress1("");
                  setCustomerAddress2("");
                }
              }}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-xs font-bold text-slate-600">New Customer</span>
          </label>
          {!isNewCustomer ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Select customer</label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={customerList.length === 0 && !loadingCustomers}
                  className="w-full text-left rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedCustomer
                    ? `${selectedCustomer.Name}${selectedCustomer.EMail ? ` — ${selectedCustomer.EMail}` : selectedCustomer.PhoneNo ? ` — ${selectedCustomer.PhoneNo}` : ""}`
                    : (loadingCustomers ? "Loading…" : "Choose an existing customer")}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full max-w-[24rem] p-2">
                  <div className="px-1 pb-2">
                    <FieldInput
                      icon={undefined}
                      placeholder="Search by name, email, phone, or ID..."
                      value={customerSearch}
                      onChange={(e: any) => setCustomerSearch(e.target.value)}
                      onPointerDown={(e: any) => e.stopPropagation()}
                      onClick={(e: any) => e.stopPropagation()}
                      onKeyDown={(e: any) => e.stopPropagation()}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {loadingCustomers ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                      ))
                    ) : filteredCustomers.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-slate-500">No customers found</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <DropdownMenuItem
                          key={c.CustomerNo}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                          }}
                          className="flex flex-col items-start gap-1 rounded-xl px-3 py-3"
                        >
                          <span className="text-sm font-semibold text-slate-800">{c.Name}</span>
                          <span className="text-[11px] text-slate-500">{c.CustomerNo}{c.EMail ? ` • ${c.EMail}` : c.PhoneNo ? ` • ${c.PhoneNo}` : ""}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div><FieldLabel>Full Name *</FieldLabel><FieldInput icon={User} value={customerName} onChange={(e: any) => setCustomerName(e.target.value)} placeholder="Legal full name" /></div>
              <div><FieldLabel>Email Address *</FieldLabel><FieldInput icon={Mail} type="email" value={customerEmail} onChange={(e: any) => setCustomerEmail(e.target.value)} placeholder="your@email.com" /></div>
              <div><FieldLabel>Mobile Number</FieldLabel><FieldInput icon={Phone} type="tel" value={customerPhone} onChange={(e: any) => setCustomerPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" /></div>
              <div><FieldLabel>Address</FieldLabel><FieldInput icon={Home} value={customerAddress1} onChange={(e: any) => setCustomerAddress1(e.target.value)} placeholder="Street address" /></div>
              <div><FieldLabel>Address Line 2</FieldLabel><FieldInput icon={Home} value={customerAddress2} onChange={(e: any) => setCustomerAddress2(e.target.value)} placeholder="Unit, floor, etc." /></div>
            </div>
          )}
        </>
      )}
    </div>
  );
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">

      {/* ── Reschedule loading overlay ─────────────────────────────────────── */}
      {isLoadingReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white border border-blue-100 rounded-2xl px-10 py-8 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-700 font-bold text-sm">Loading booking details…</p>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger />

          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Book Now</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

      </header>

      <MobileProgress currentStep={currentStep} totalSteps={5} />

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col max-w-screen-xl mx-auto w-full px-6 py-6 gap-5">
        {/* Reschedule banner */}
        {isRescheduling && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-sm font-semibold">
            <span>🔄</span>
            <span>Rescheduling booking <strong>{rescheduleEntryNo}</strong> — only Date &amp; Time can be changed.</span>
          </div>
        )}
        {/* Row 1: Horizontal cards — hidden/locked when rescheduling */}
        <div className="flex gap-4">
          {/* Location */}
          <HorizontalSetupCard
            step={1} currentStep={currentStep} title="Location" icon={MapPin}
            disabled={isRescheduling}
            readonlyValue={selectedBranchObj?.description ?? rescheduleData?.BookingSetupCode}
            readonlySub2="Address not available"
          >
            <div className="space-y-2">
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><MapPin size={14} strokeWidth={2} /></div>
                <select value={selectedBranch || ""} onChange={e => sel.branch(e.target.value)} disabled={loadingBranches || !isCustomerRole} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{loadingBranches ? "Loading…" : !isCustomerRole ? "Location fixed by active team" : "Choose branch"}</option>
                  {branches.map(b => <option key={b.code} value={b.code}>{b.description}</option>)}
                </select>
              </div>
              <div className="px-1 text-xs text-slate-400">{selectedBranch
                ? selectedBranchData?.address || "Address not available"
                : "Select a branch"}</div>
            </div>
          </HorizontalSetupCard>

          {/* Service */}
          <HorizontalSetupCard
            step={2} currentStep={currentStep} title="Service" icon={Briefcase}
            disabled={isRescheduling}
            readonlyValue={selectedServiceObj?.name ?? rescheduleData?.ServiceName}
            readonlySub2={selectedServiceObj ? `${selectedServiceObj.duration} · ${selectedServiceObj.price}` : undefined}
          >
            <div className="space-y-2">
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Briefcase size={14} strokeWidth={2} /></div>
                <select value={selectedService || ""} onChange={e => sel.service(e.target.value)} disabled={!selectedBranch || loadingServices} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{loadingServices ? "Loading…" : "Choose service"}</option>
                  {services.map((service: any) => <option key={service.id} value={service.id}>{service.name} - {service.price} ({service.duration})</option>)}
                </select>
              </div>
              {selectedService && (() => { const sv = services.find(s => s.id === selectedService); return sv ? <div className="px-1 text-xs text-slate-500">{sv.duration} · {sv.price}</div> : null; })()}
            </div>
          </HorizontalSetupCard>

          {/* Professional */}
          <HorizontalSetupCard
            step={3} currentStep={currentStep} title="Professional" icon={Users}
            readonlyValue={selectedStaffObj?.staffName ?? rescheduleData?.StaffName}
          >
            {staffPanelContent}
          </HorizontalSetupCard>
        </div>

        {/* Row 2: Calendar + Timeslots | Right panel */}
        <div className="flex gap-5 flex-1 min-h-0">
          {/* Left: Calendar + Timeslots */}
          <div className="flex-1 flex gap-4 min-h-0 items-stretch">
            {/* Calendar */}
            <div className={`flex-1 min-h-[32rem] max-h-[32rem] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-opacity
              ${(!selectedStaff && !isRescheduling) ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <StepBadge number={4} done={currentStep > 4} active={currentStep === 4} />
                <Calendar size={13} strokeWidth={2} className={currentStep >= 4 ? "text-blue-600" : "text-slate-400"} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStep >= 4 ? "text-blue-700" : "text-slate-400"}`}>Pick a Date</span>
                {currentStep > 4 && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-4 bg-slate-50 rounded-xl p-1">
                  <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>
                  <span className="text-sm font-bold text-slate-700">{MONTH_NAMES[month]} {year}</span>
                  <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {DAY_LABELS.map((d, i) => <div key={i} className="text-[9px] font-bold text-slate-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => renderCalendarDay(i + 1))}
                </div>
              </div>
              <div className="border-t border-slate-100 px-4">
                {adminControlsCalendar}
              </div>
            </div>

            {/* Timeslots */}
            <div className={`flex-1 min-h-[32rem] max-h-[32rem] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-opacity
              ${(!selectedStaff && !isRescheduling) ? "opacity-40 pointer-events-none" : ""}`}>
              <TimeslotPanel selectedDate={selectedDate} timeslots={timeslots} loading={loadingTimeslots}
                selectedTime={selectedTime} onSelectTime={t => setSelectedTime(t)} stepNumber={4} currentStep={currentStep} skipAvailabilityCheck={skipAvailabilityCheck} onSkipAvailabilityCheckChange={checked => setSkipAvailabilityCheck(checked ? "true" : "false")} isCustomerRole={isCustomerRole} noStaffAvailable={noStaffAvailable} contactNumber={contactNumber} />
            </div>
          </div>

          {/* Right panel: Customer + Details + CTA */}
          <div className="w-80 shrink-0 flex flex-col gap-4">

            <div
              className={`flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-opacity ${(!selectedTime || (selectedTimeWarning && skipAvailabilityCheck !== "true"))
                ? "opacity-40 pointer-events-none"
                : ""
                }`}
            >

              {/* ── Customer Section ───────────────────────────── */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
                <StepBadge number={5} done={false} active={currentStep === 5} />
                <User size={13} strokeWidth={2} className="text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Customer
                </span>
              </div>

              {/* Customer Body */}
              <div className="p-4 shrink-0 bg-slate-50/60">

                {isCustomerRole ? (

                  <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {(sessionUser?.name || "?")[0].toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-700">
                        {sessionUser?.name}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {sessionUser?.email}
                      </div>
                    </div>

                    <CheckCircle2
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 text-blue-500"
                    />
                  </div>

                ) : isRescheduling ? (

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 opacity-75 cursor-not-allowed">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-white">
                      {(rescheduleData?.Name || "?")[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-600">
                        {rescheduleData?.Name}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {rescheduleData?.EMail}
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                      Locked
                    </span>
                  </div>

                ) : (
                  <>

                    {/* Toggle */}
                    <label className="mb-3 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNewCustomer}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsNewCustomer(checked);

                          if (checked) {
                            setSelectedCustomer(null);
                          } else {
                            setCustomerName("");
                            setCustomerEmail("");
                            setCustomerPhone("");
                            setCustomerAddress1("");
                            setCustomerAddress2("");
                          }
                        }}
                        className="h-4 w-4 accent-blue-600"
                      />

                      <span className="text-xs font-bold text-slate-600">
                        New Customer
                      </span>
                    </label>

                    {/* Existing Customer */}
                    {!isNewCustomer ? (

                      <div className="rounded-xl border border-slate-100 bg-white p-3 space-y-2">

                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Select customer
                        </label>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={customerList.length === 0 && !loadingCustomers}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {selectedCustomer
                              ? `${selectedCustomer.Name}${selectedCustomer.EMail
                                ? ` — ${selectedCustomer.EMail}`
                                : selectedCustomer.PhoneNo
                                  ? ` — ${selectedCustomer.PhoneNo}`
                                  : ""
                              }`
                              : loadingCustomers
                                ? "Loading…"
                                : "Choose an existing customer"}
                          </DropdownMenuTrigger>

                          <DropdownMenuContent className="w-full max-w-[24rem] p-2">

                            <div className="px-1 pb-2">
                              <FieldInput
                                icon={undefined}
                                placeholder="Search by name, email, phone, or ID..."
                                value={customerSearch}
                                onChange={(e: any) => setCustomerSearch(e.target.value)}
                                onPointerDown={(e: any) => e.stopPropagation()}
                                onClick={(e: any) => e.stopPropagation()}
                                onKeyDown={(e: any) => e.stopPropagation()}
                                className="border-slate-200 bg-slate-50"
                              />
                            </div>

                            <div className="max-h-60 space-y-1 overflow-y-auto">

                              {loadingCustomers ? (
                                [1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="h-12 animate-pulse rounded-xl bg-slate-100"
                                  />
                                ))
                              ) : filteredCustomers.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-slate-500">
                                  No customers found
                                </div>
                              ) : (
                                filteredCustomers.map((c) => (
                                  <DropdownMenuItem
                                    key={c.CustomerNo}
                                    onClick={() => {
                                      setSelectedCustomer(c);
                                      setCustomerSearch("");
                                    }}
                                    className="flex flex-col items-start gap-1 rounded-xl px-3 py-3"
                                  >
                                    <span className="text-sm font-semibold text-slate-800">
                                      {c.Name}
                                    </span>

                                    <span className="text-[11px] text-slate-500">
                                      {c.CustomerNo}
                                      {c.EMail
                                        ? ` • ${c.EMail}`
                                        : c.PhoneNo
                                          ? ` • ${c.PhoneNo}`
                                          : ""}
                                    </span>
                                  </DropdownMenuItem>
                                ))
                              )}

                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </div>

                    ) : (

                      /* New Customer Form */
                      <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-100 bg-white p-3 space-y-2.5">

                        <div>
                          <FieldLabel>Full Name *</FieldLabel>
                          <FieldInput
                            icon={User}
                            value={customerName}
                            onChange={(e: any) => setCustomerName(e.target.value)}
                            placeholder="Legal full name"
                          />
                        </div>

                        <div>
                          <FieldLabel>Email Address *</FieldLabel>
                          <FieldInput
                            icon={Mail}
                            type="email"
                            value={customerEmail}
                            onChange={(e: any) => setCustomerEmail(e.target.value)}
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <FieldLabel>Mobile Number</FieldLabel>
                          <FieldInput
                            icon={Phone}
                            type="tel"
                            value={customerPhone}
                            onChange={(e: any) => setCustomerPhone(e.target.value)}
                            placeholder="+63 9XX XXX XXXX"
                          />
                        </div>

                        <div>
                          <FieldLabel>Address</FieldLabel>
                          <FieldInput
                            icon={Home}
                            value={customerAddress1}
                            onChange={(e: any) => setCustomerAddress1(e.target.value)}
                            placeholder="Street address"
                          />
                        </div>

                        <div>
                          <FieldLabel>Address Line 2</FieldLabel>
                          <FieldInput
                            icon={Home}
                            value={customerAddress2}
                            onChange={(e: any) => setCustomerAddress2(e.target.value)}
                            placeholder="Unit, floor, etc."
                          />
                        </div>

                      </div>

                    )}

                  </>
                )}
              </div>

              {/* ── Notes Section ───────────────────────────── */}
              <div className="border-t border-slate-100 shrink-0">

                {/* Header */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
                  <FileText size={13} strokeWidth={2} className="text-blue-600" />

                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Notes
                  </span>
                </div>

                {/* Notes Body */}
                <div className="bg-slate-50/60 p-4">
                  <div className="rounded-xl border border-slate-100 bg-white p-3">
                    <FieldTextarea
                      rows={3}
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                      placeholder="Special requests, reason for visit…"
                      disabled={!selectedTime}
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* ── CTA ───────────────────────────── */}
            <button
              disabled={!isFormValid || isBookingLoading}
              onClick={handleConfirmOpen}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              {isBookingLoading ? (
                <>
                  <Spinner size={18} />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  {isRescheduling ? "Reschedule" : "Book Appointment"}
                </>
              )}
            </button>

            {!isFormValid && (
              <p className="-mt-1 text-center text-[11px] text-slate-400">
                {!selectedTime
                  ? "Select a date and time slot to continue"
                  : selectedTimeWarning && skipAvailabilityCheck !== "true"
                    ? "Selected slot cannot be booked. Choose another time."
                    : "Complete all required fields to continue"}
              </p>
            )}

          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────────────────── */}
      <div className="md:hidden flex-1 flex flex-col">
        {/* Reschedule banner */}
        {isRescheduling && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-700 text-xs font-semibold">
            <span>🔄</span><span>Rescheduling — only Date &amp; Time can be changed</span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 bg-white top-[104px] z-30">
          {[
            { id: "select", label: "Setup", done: currentStep > 3 },
            { id: "schedule", label: "Schedule", done: currentStep > 4 },
            { id: "details", label: "Details", done: false },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobilePanel(tab.id)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all relative
                ${mobilePanel === tab.id ? "text-blue-600" : "text-slate-400"}`}>
              {tab.done && <CheckCircle2 size={10} strokeWidth={3} className="inline mr-1 text-blue-500" />}
              {tab.label}
              {mobilePanel === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-8 space-y-3">
          {/* Mobile: Setup tab */}
          {mobilePanel === "select" && !isRescheduling && (
            <div className="space-y-3">
              {[
                {
                  step: 1, title: "Location", icon: MapPin,
                  content: (
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><MapPin size={14} strokeWidth={2} /></div>
                      <select value={selectedBranch || ""} onChange={e => sel.branch(e.target.value)} disabled={loadingBranches} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{loadingBranches ? "Loading…" : "Choose branch"}</option>
                        {branches.map(b => <option key={b.code} value={b.code}>{b.description}</option>)}
                      </select>
                    </div>
                  ),
                },
                {
                  step: 2, title: "Service", icon: Briefcase,
                  content: (
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Briefcase size={14} strokeWidth={2} /></div>
                      <select value={selectedService || ""} onChange={e => sel.service(e.target.value)} disabled={!selectedBranch || loadingServices} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{loadingServices ? "Loading…" : "Choose service"}</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.duration}  ({s.price})</option>)}
                      </select>
                    </div>
                  ),
                },
                {
                  step: 3, title: "Professional", icon: Users,
                  content: staffPanelContent,
                },
              ].map(card => (
                <HorizontalSetupCard key={card.step} step={card.step} currentStep={currentStep} title={card.title} icon={card.icon}>
                  {card.content}
                </HorizontalSetupCard>
              ))}
            </div>
          )}

          {/* Mobile: Schedule tab */}
          {mobilePanel === "schedule" && (
            <div className={`space-y-4 ${(!selectedStaff && !isRescheduling) ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <StepBadge number={4} done={currentStep > 4} active={currentStep === 4} />
                  <Calendar size={13} strokeWidth={2} className="text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Pick a Date</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4 bg-slate-50 rounded-xl p-1">
                    <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-500"><ChevronLeft size={16} strokeWidth={2.5} /></button>
                    <span className="text-sm font-bold text-slate-700">{MONTH_NAMES[month]} {year}</span>
                    <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-500"><ChevronRight size={16} strokeWidth={2.5} /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {DAY_LABELS.map((d, i) => <div key={i} className="text-[9px] font-bold text-slate-400 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => renderCalendarDay(i + 1))}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-4">
                  {adminControlsCalendar}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
                <TimeslotPanel selectedDate={selectedDate} timeslots={timeslots} loading={loadingTimeslots}
                  selectedTime={selectedTime} onSelectTime={t => setSelectedTime(t)} stepNumber={4} currentStep={currentStep} skipAvailabilityCheck={skipAvailabilityCheck} onSkipAvailabilityCheckChange={checked => setSkipAvailabilityCheck(checked ? "true" : "false")} isCustomerRole={isCustomerRole} noStaffAvailable={noStaffAvailable} contactNumber={contactNumber} />
              </div>
            </div>
          )}

          {/* Mobile: Details tab */}
          {mobilePanel === "details" && (
            <div className="space-y-4">
              {/* Summary pill */}
              {selectedTime && selectedDate && (
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white">
                  <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={10} /> Booking Summary
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: MapPin, val: selectedBranchObj?.description ?? selectedBranch },
                      { icon: Briefcase, val: selectedServiceObj?.name },
                      { icon: User, val: selectedStaffObj?.staffName ?? (rescheduleData?.StaffName ?? null) },
                      { icon: Calendar, val: `${MONTH_NAMES[selectedDate.month]} ${selectedDate.day}, ${selectedDate.year}` },
                      { icon: Clock, val: selectedTime },
                    ].filter(x => x.val).map((x, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <x.icon size={13} strokeWidth={2} />{x.val}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-opacity ${(!selectedTime || (selectedTimeWarning && skipAvailabilityCheck !== "true")) ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="max-h-[56vh] overflow-y-auto p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                      <StepBadge number={5} done={false} active={currentStep === 5} />
                      <User size={13} strokeWidth={2} className="text-blue-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Customer</span>
                    </div>
                    <div className="p-4">{customerPanel}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                      <FileText size={13} strokeWidth={2} className="text-blue-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Notes</span>
                    </div>
                    <div className="p-4">
                      <FieldTextarea rows={3} value={notes} onChange={(e: any) => setNotes(e.target.value)}
                        placeholder="Special requests, reason for visit…" disabled={!selectedTime} />
                    </div>
                  </div>
                </div>
              </div>

              <button disabled={!isFormValid || isBookingLoading} onClick={handleConfirmOpen}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl
                  transition-all shadow-xl shadow-blue-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5">
                {isBookingLoading ? <><Spinner size={18} /> Processing…</> : <><CheckCircle2 size={18} strokeWidth={2.5} /> {isRescheduling ? "Reschedule" : "Book Appointment"}</>}
              </button>
              {!isFormValid && (
                <p className="text-[11px] text-slate-400 text-center">
                  {!selectedTime ? "Select a date and time slot to continue"
                    : (selectedTimeWarning && skipAvailabilityCheck !== "true") ? "Selected slot cannot be booked. Choose another time."
                      : "Complete all required fields to continue"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mobile bottom CTA */}
        {mobilePanel !== "details" && currentStep > 1 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3">
            {mobilePanel === "select" && currentStep >= 4 && (
              <button onClick={() => setMobilePanel("schedule")}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                Choose Date &amp; Time <ArrowRight size={15} />
              </button>
            )}
            {mobilePanel === "schedule" && currentStep >= 5 && (
              <button onClick={() => setMobilePanel("details")}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                Fill in Details <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ──────────────────────────────────────────────────── */}
      <ConfirmDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleBooking} loading={isBookingLoading} data={confirmData} isRescheduling={isRescheduling} />
    </div>
  );
}
