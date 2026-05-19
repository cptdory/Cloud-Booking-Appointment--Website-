"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNextStep } from "nextstepjs";
import { CheckCircle2, MapPin, Briefcase, Users, Calendar, User, Clock, Phone, Mail, FileText, RefreshCw, ChevronLeft, ChevronRight, X, ShieldCheck, Stethoscope, ArrowRight, Sparkles, Clock10Icon } from "lucide-react";
import { sileo } from "sileo";
import { usePathname } from "next/navigation";
// ─── Utilities ─────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
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
  if (Number.isNaN(price)) return "₱0.00";
  return `₱${price.toFixed(2)}`;
};
const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg style={{ width: size, height: size }} className="animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);
// ─── Reusable form primitives ──────────────────────────────────────────────────
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
// ─── Step badge ────────────────────────────────────────────────────────────────
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
// ─── Horizontal Setup Card (one of four across the top) ───────────────────────
function HorizontalSetupCard({ step, currentStep, title, icon: Icon, children, id }: {
  step: number; currentStep: number; title: string; icon: React.ComponentType<any>; children: React.ReactNode; id?: string;
}) {
  const done = currentStep > step;
  const active = currentStep === step;
  const locked = currentStep < step;
  return (
    <div id={id} className={`flex-1 rounded-2xl border transition-all duration-300 overflow-hidden
      ${active ? "border-blue-200 bg-white shadow-md shadow-blue-50" : ""}
      ${done ? "border-blue-100 bg-blue-50/40" : ""}
      ${locked ? "border-slate-100 bg-slate-50/60 opacity-50" : ""}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-inherit">
        <StepBadge number={step} done={done} active={active} />
        <Icon size={12} strokeWidth={2} className={active || done ? "text-blue-600" : "text-slate-400"} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${active || done ? "text-blue-700" : "text-slate-400"}`}>
          {title}
        </span>
        {active && <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Select</span>}
        {done && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}
// ─── OTP Dialog ────────────────────────────────────────────────────────────────
function OtpDialog({ open, email, loading, timeRemaining, otpValidityPeriod, canResend, onVerify, onResend, onClose }: { open: boolean; email: string; loading: boolean; timeRemaining: number; otpValidityPeriod: number; canResend: boolean; onVerify: (otp: string) => void; onResend: () => void; onClose: () => void }) {
  const [otp, setOtp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) { setOtp(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);
  if (!open) return null;
  const totalSec = otpValidityPeriod * 60;
  const progress = totalSec > 0 ? (timeRemaining / totalSec) * 100 : 0;
  const isExpired = timeRemaining === 0;
  const isUrgent = timeRemaining <= 30 && !isExpired;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 bg-slate-100">
          <div className={`h-full transition-all duration-1000 ease-linear rounded-full ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${progress}%` }} />
        </div>
        <div className="p-6 sm:p-7">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <ShieldCheck size={28} className="text-blue-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Verify your email</h2>
            <p className="text-sm text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span></p>
          </div>
          <input ref={inputRef} type="text" inputMode="numeric" maxLength={8}
            className={`w-full rounded-2xl border-2 px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] font-mono
              focus:outline-none transition-all mb-2
              ${isExpired ? "border-red-200 bg-red-50 text-red-500" : otp ? "border-blue-300 bg-blue-50/40 text-slate-800" : "border-slate-200 bg-slate-50 text-slate-800"}
              focus:border-blue-400 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300 placeholder:text-xl`}
            placeholder="——————" value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && !loading && !isExpired && otp && onVerify(otp)} />
          <div className="flex items-center justify-between mb-5 px-1">
            <span className={`text-xs font-semibold tabular-nums ${isExpired ? "text-red-500" : isUrgent ? "text-orange-500" : "text-slate-400"}`}>
              {isExpired ? "⚠ Code expired" : `⏱ ${formatTime(timeRemaining)} remaining`}
            </span>
            <button onClick={onResend} disabled={!canResend}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Resend code
            </button>
          </div>
          <button onClick={() => onVerify(otp)} disabled={loading || !otp || isExpired}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl
              transition-all shadow-lg shadow-blue-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 mb-3">
            {loading ? <><Spinner /> Verifying…</> : <>Verify & continue <ArrowRight size={15} /></>}
          </button>
          <button onClick={onClose}
            className="w-full py-3 border border-slate-200 text-slate-500 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-all">
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, loading, data }: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean; data: any }) {
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
                <h2 className="text-base font-bold text-slate-800">Confirm booking</h2>
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
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking…</> : <><CheckCircle2 size={15} strokeWidth={2.5} /> Confirm</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── Mobile progress ───────────────────────────────────────────────────────────
function MobileProgress({ currentStep }: { currentStep: number }) {
  const steps = ["Location", "Service", "Staff", "Date", "Time", "Details"];
  return (
    <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500">Step {Math.min(currentStep, 6)} of 6</span>
        <span className="text-xs font-semibold text-blue-600">{steps[Math.min(currentStep, 6) - 1]}</span>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentStep ? "bg-blue-600" : "bg-slate-100"}`} />
        ))}
      </div>
    </div>
  );
}
// ─── Inline Timeslot Panel ─────────────────────────────────────────────────────
function TimeslotPanel({ selectedDate, timeslots, loading, selectedTime, onSelectTime, currentStep }: {
  selectedDate: any; timeslots: any[]; loading: boolean; selectedTime: string; onSelectTime: (time: string) => void; currentStep: number;
}) {
  const slots = timeslots || [];
  const selectedSlot = slots.find((ts: any) => ts.time === selectedTime) ?? null;
  const selectedSlotWarning = Boolean(selectedSlot?.availability && !selectedSlot?.allowBooking);
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <StepBadge number={5} done={currentStep > 5} active={currentStep === 5} />
        <Clock10Icon size={13} strokeWidth={2} className={currentStep >= 5 ? "text-blue-600" : "text-slate-400"} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStep >= 5 ? "text-blue-700" : "text-slate-400"}`}>Pick a Time</span>
        {currentStep === 5 && <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Select</span>}
        {currentStep > 5 && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
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
              {Array.from({ length: 8 }).map((_: any, i: number) => (
                <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : timeslots.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <RefreshCw size={24} strokeWidth={1.5} className="mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No slots available</p>
            <p className="text-[11px] text-slate-300 mt-1">No time slots were returned for this date.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((ts: any) => {
                const isSelected = selectedTime === ts.time;
                const isWarning = ts.availability === true && ts.allowBooking === false;
                const isDisabled = ts.availability === false && ts.allowBooking === false;
                return (
                  <button
                    key={ts.id}
                    type="button"
                    onClick={() => !isDisabled && onSelectTime(ts.time)}
                    disabled={isDisabled}
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
                      }`}
                  >
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
    </div>
  );
}
// ─── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";
  const { startNextStep, setCurrentStep, closeNextStep, currentStep: tourStep, isNextStepVisible } = useNextStep();
  const [orgName, setOrgName] = useState<string>("");
  const [headline, setHeadline] = useState("");
  const [logo, setLogo] = useState<string>("");
  const [orgSetupLoading, setOrgSetupLoading] = useState<boolean>(true);
  const [otpValidityPeriod, setOtpValidityPeriod] = useState<number>(5);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
  const [loadingTimeslots, setLoadingTimeslots] = useState<boolean>(false);
  const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [noPreferenceStaff, setNoPreferenceStaff] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress1, setCustomerAddress1] = useState<string>("");
  const [customerAddress2, setCustomerAddress2] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [otpDialogOpen, setOtpDialogOpen] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [otpSendLoading, setOtpSendLoading] = useState<boolean>(false);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string>("");
  const [otpTimeRemaining, setOtpTimeRemaining] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);
  // Mobile tab state
  const [mobilePanel, setMobilePanel] = useState<string>("select");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const today = new Date();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const selectedServiceObj = services.find((s) => s.id === selectedService) ?? null;
  const selectedStaffObj = assignedStaff.find((s) => s.staffId === selectedStaff) ?? null;
  const selectedBranchObj = branches.find((b) => b.code === selectedBranch) ?? null;
  const selectedTimeslot = (timeslots || []).find((ts: any) => ts.time === selectedTime) ?? null;
  const selectedTimeWarning = Boolean(selectedTimeslot?.availability && !selectedTimeslot?.allowBooking);
  const isFormValid = customerName !== "" && customerEmail !== "" && selectedTime !== "" && !selectedTimeWarning;
  const currentStep = !selectedBranch ? 1
    : !selectedService ? 2
      : !selectedStaff && !noPreferenceStaff ? 3
        : !selectedDate ? 4
          : !selectedTime ? 5
            : selectedTimeWarning ? 5 : 6;
  useEffect(() => {
    if (currentStep >= 4) setMobilePanel("schedule");
    if (currentStep >= 6) setMobilePanel("details");
  }, [currentStep]);
  // ── Auto-start tour on page load ──────────────────────────────────────────
  // useEffect(() => {
  //   const isMobile = window.innerWidth < 768; // Tailwind md breakpoint
  //   startNextStep(isMobile ? "bookingTourMobile" : "bookingTour");
  // }, []);
  // ── OTP countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!otpDialogOpen || otpTimeRemaining <= 0) return;
    setCanResend(false);
    const iv = setInterval(() => {
      setOtpTimeRemaining((p: number) => {
        if (p <= 1) { clearInterval(iv); setCanResend(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [otpDialogOpen, otpTimeRemaining]);
  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchOrgSetup = async () => {
    try {
      const res = await fetch(`/api/booking-organization-setup?tenantId=${tenantId}`);
      const d = await res.json();
      setOrgName(d?.Name ?? "");
      setLogo(d?.Logo ?? "");
      setOtpValidityPeriod(d?.OTPValidityPeriod ?? 5);
      setHeadline(d?.Headline ?? "");
    } catch (_) { }
    finally { setOrgSetupLoading(false); }
  };
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await fetch("/api/booking-branch-setup/get-booking-setup-list");
      const d = await res.json();
      setBranches((Array.isArray(d) ? d : []).map((b) => ({ code: String(b.Code ?? ""), description: String(b.Description ?? ""), address: String(b.Address ?? "") })));
    } catch (_) { }
    finally { setLoadingBranches(false); }
  };
  const selectedBranchData = branches.find(
    (b: any) => b.code === selectedBranch
  );
  const fetchServices = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      setLoadingServices(true);
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selectedBranch}`);
      const d = await res.json();
      const list = Array.isArray(d) ? d : [];
      const p = list[0]?.BookingParameter?.find((x: any) => x.BookingParameterId === 1);
      setServices((p?.BookingParameterValue ?? []).map((s: any) => {
        const durationMinutes = Number(s.BookingParameterValueDuration ?? 0);
        const priceValue = Number(s.BookingParameterValuePrice ?? 0);
        return {
          id: String(s.BookingParameterValueId ?? ""),
          code: String(s.BookingParameterValueCode ?? ""),
          name: String(s.BookingParameterValueDescription ?? ""),
          duration: formatDurationLabel(durationMinutes),
          price: formatPriceLabel(priceValue),
        };
      }));
    } catch (_) { }
    finally { setLoadingServices(false); }
  }, [selectedBranch]);

  const fetchStaff = useCallback(async () => {
    if (!selectedBranch || !selectedService) return;
    try {
      setLoadingStaff(true);
      const res = await fetch("/api/booking-staff-rela/get-booking-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode: selectedBranch, serviceId: selectedService }),
      });
      const d = await res.json();
      setAssignedStaff((Array.isArray(d) ? d : []).map((s: any) => ({
        staffId: String(s.StaffId ?? ""),
        staffCode: String(s.StaffCode ?? ""),
        staffName: String(s.StaffName ?? ""),
      })));
    } catch (_) { }
    finally { setLoadingStaff(false); }
  }, [selectedBranch, selectedService]);
  const fetchTimeslots = useCallback(async () => {
    if (!selectedDate || !selectedBranch) return;
    try {
      setLoadingTimeslots(true);
      const fullYear =
        String(selectedDate.year).length === 2 ? `20${selectedDate.year}` : selectedDate.year;
      const fmt = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${fullYear}`;
      const res = await fetch("/api/available-timeslot-v2/get-available-timeslot-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode: selectedBranch,
          bookingDate: fmt,
          serviceId: selectedService,
          staffId: noPreferenceStaff ? "" : selectedStaff,
        }),
      });
      const d = await res.json();
      console.log(d);
      setTimeslots((Array.isArray(d) ? d : []).map((sl: any) => ({
        id: String(sl.Id ?? ""),
        time: new Date(`1970-01-01T${sl.Time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        availability: Boolean(sl.IsAvailable),
        allowBooking: Boolean(sl.AllowBooking),
      })));
    } catch (_) { }
    finally { setLoadingTimeslots(false); }
  }, [selectedDate, selectedBranch, selectedStaff, selectedService, noPreferenceStaff]);
  // ── OTP handlers ──────────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!customerEmail) { sileo.error({ title: "Email is required", fill: "#171717" }); return; }
    setOtpSendLoading(true);
    try {
      const res = await fetch("/api/one-time-password/otp-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: customerEmail, verificationType: "Email Verification" }),
      });
      const d = await res.json();
      if (!d) throw new Error("No request ID");
      setRequestId(String(d));
      setOtpTimeRemaining(otpValidityPeriod * 60);
      setCanResend(false);
      setOtpDialogOpen(true);
    } catch (e) {
      sileo.error({ title: e instanceof Error ? e.message : "Failed to send OTP", fill: "#171717" });
    } finally { setOtpSendLoading(false); }
  };
  const handleResendOtp = async () => {
    setCanResend(false);
    try {
      const res = await fetch("/api/one-time-password/otp-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: customerEmail, verificationType: "Email Verification" }),
      });
      const d = await res.json();
      if (!d) throw new Error("No request ID");
      setRequestId(String(d));
      setOtpTimeRemaining(otpValidityPeriod * 60);
      sileo.success({ title: "New code sent!", fill: "#171717" });
    } catch (e) {
      sileo.error({ title: e instanceof Error ? e.message : "Failed to resend OTP", fill: "#171717" });
      setCanResend(true);
    }
  };
  const handleVerifyOtp = async (otp: string) => {
    if (!otp) { sileo.error({ title: "Please enter the OTP", fill: "#171717" }); return; }
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/one-time-password/otp-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, otp }),
      });
      const d = await res.json();
      if (d === true) { setOtpDialogOpen(false); setConfirmDialogOpen(true); }
      else sileo.error({ title: "Invalid OTP. Please try again.", fill: "#171717" });
    } catch (e) {
      sileo.error({ title: e instanceof Error ? e.message : "OTP verification failed", fill: "#171717" });
    } finally { setVerifyLoading(false); }
  };
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || selectedTimeWarning || !customerName || !customerEmail) return;
    setIsBookingLoading(true);
    try {
      const fmt = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${selectedDate.year}`;
      const res = await fetch("/api/available-timeslot-v2/book-available-timeslot-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode: selectedBranch,
          bookingDate: fmt,
          startTime: selectedTime,
          serviceId: selectedService,
          staffid: noPreferenceStaff ? "" : selectedStaff,
          bookingNote: notes,
          bookingEntryNo: "",
          customerNoOrEmailAdd: customerEmail,
          customerName,
          customerPhoneNo: customerPhone,
          customerBirthDate: "",
          customerAddress1,
          customerAddress2,
          skipTimeSlotAvailabilityCheck: "false",
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setConfirmDialogOpen(false);
      sileo.success({ title: "Booking confirmed successfully!", fill: "#171717" });
      setSelectedBranch(""); setSelectedService(""); setSelectedStaff("");
      setSelectedDate(null); setSelectedTime("");
      setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
      setCustomerAddress1(""); setCustomerAddress2(""); setNotes("");
      setNoPreferenceStaff(false); setRequestId(""); setMobilePanel("select");
    } catch (e) {
      sileo.error({ title: e instanceof Error ? e.message : "Booking failed. Please try again.", fill: "#171717" });
    } finally { setIsBookingLoading(false); }
  };
  // ── Selection helpers ──────────────────────────────────────────────────────
  const sel = {
    branch: (v: string) => { setSelectedBranch(v); setSelectedService(""); setSelectedStaff(""); setSelectedDate(null); setSelectedTime(""); setTimeslots([]); setNoPreferenceStaff(true); },
    service: (v: string) => { setSelectedService(v); setSelectedStaff(""); setSelectedDate(null); setSelectedTime(""); setTimeslots([]); setNoPreferenceStaff(true); },
    staff: (v: string) => {
      setSelectedStaff(v);
      setNoPreferenceStaff(false);
      setSelectedTime("");
      setTimeslots([]);
      // If user is already at/after date selection, keep the selected date and let the effect re-fetch timeslots.
      if (currentStep < 4) setSelectedDate(null);
    },
    date: async (d: any) => {
      setSelectedDate(d);
      setSelectedTime("");
      setTimeslots([]);
    },
  };
  const pathname = usePathname();
  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchOrgSetup(); fetchBranches(); }, [pathname]);
  useEffect(() => { if (selectedBranch) fetchServices(); }, [selectedBranch, fetchServices]);
  useEffect(() => { if (selectedService && selectedBranch) fetchStaff(); }, [selectedService, selectedBranch, fetchStaff]);
  useEffect(() => {
    if (selectedDate && selectedBranch && selectedService && (selectedStaff || noPreferenceStaff)) {
      fetchTimeslots();
    }
  }, [selectedDate, selectedBranch, selectedStaff, selectedService, noPreferenceStaff, fetchTimeslots]);
  // Auto-select today's date when user reaches the date step (4) and all other selections exist.
  useEffect(() => {
    if (currentStep >= 4 && !selectedDate && selectedBranch && selectedService && (selectedStaff || noPreferenceStaff)) {
      const d = new Date();
      setSelectedDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
  }, [currentStep, selectedBranch, selectedService, selectedStaff, noPreferenceStaff, selectedDate]);

  // ── Auto-select today when service selected with no preference ────────────
  useEffect(() => {
    if (selectedService && noPreferenceStaff && !selectedDate && selectedBranch) {
      const d = new Date();
      setSelectedDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
  }, [selectedService, noPreferenceStaff, selectedBranch, selectedDate]);

  // ── Auto-select today when service selected with no preference ────────────
  useEffect(() => {
    if (selectedService && noPreferenceStaff && !selectedDate && selectedBranch) {
      const d = new Date();
      setSelectedDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
    }
  }, [selectedService, noPreferenceStaff, selectedBranch, selectedDate]);
  // ── Auto-advance tour steps ────────────────────────────────────────────────
  useEffect(() => {
    if (!isNextStepVisible) return;
    if (tourStep === 0 && selectedBranch) {
      setCurrentStep(1);
    }
  }, [selectedBranch, tourStep, setCurrentStep, isNextStepVisible]);
  useEffect(() => {
    if (!isNextStepVisible) return;
    if (tourStep === 1 && selectedService) {
      setCurrentStep(2);
    }
  }, [selectedService, tourStep, setCurrentStep, isNextStepVisible]);
  useEffect(() => {
    if (!isNextStepVisible) return;
    if (tourStep === 2 && (selectedStaff || noPreferenceStaff)) {
      const timer = setTimeout(() => {
        closeNextStep();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedStaff, noPreferenceStaff, tourStep, closeNextStep, isNextStepVisible]);
  const confirmData = {
    branch: selectedBranchObj?.description ?? selectedBranch,
    service: selectedServiceObj?.name ?? "",
    staff: selectedStaffObj?.staffName ?? selectedStaffObj?.staffCode ?? "",
    date: selectedDate ? `${MONTH_NAMES[selectedDate.month]} ${selectedDate.day}, ${selectedDate.year}` : "",
    time: selectedTime,
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    notes,
  };
  const toImageSrc = (base64?: string) => {
    if (!base64) return "";
    if (base64.startsWith("data:image")) return base64;
    return `data:image/png;base64,${base64}`;
  };
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* LEFT: Brand */}
          <div className="flex items-center gap-3">

            {/* Logo */}
            <div className="shrink-0">
              {logo ? (
                <img
                  src={toImageSrc(logo)}
                  alt={orgName}
                  className="h-10 w-28 rounded-lg object-contain bg-primary-foreground/10 px-1"
                />
              ) : (
                <div className="flex h-10 w-28 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground font-bold text-lg">
                  {orgName?.[0] ?? ""}
                </div>
              )}
            </div>

            {/* Text block */}
            <div className="flex flex-col leading-tight">
              {headline && (
                <div className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[180px] sm:max-w-none">
                  {headline}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">

            {/* Desktop Tour */}
            {/* <button
        onClick={() => startNextStep("bookingTour")}
        className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors items-center gap-1.5"
      >
        <Sparkles size={12} strokeWidth={2} />
        Tour
      </button> */}

            {/* Mobile Tour */}
            {/* <button
        onClick={() => startNextStep("bookingTourMobile")}
        className="inline-flex md:hidden px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors items-center gap-1.5"
      >
        <Sparkles size={12} strokeWidth={2} />
        Tour
      </button> */}
          </div>
        </div>
      </header>
      <MobileProgress currentStep={currentStep} />
      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col max-w-screen-xl mx-auto w-full px-6 py-6 gap-5">
        {/* ── Row 1: Horizontal setup cards (4 columns) ── */}
        <div>
          <div className="flex gap-4">
            {/* Location */}
            <HorizontalSetupCard id="location-card" step={1} currentStep={currentStep} title="Location" icon={MapPin}>
              <div className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={14} strokeWidth={2} />
                  </div>
                  <select value={selectedBranch || ""} onChange={e => sel.branch(e.target.value)} disabled={loadingBranches} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{loadingBranches ? "Loading…" : "Choose branch"}</option>
                    {branches.map((branch: any) => <option key={branch.code} value={branch.code}>{branch.description}</option>)}
                  </select>
                </div>
                {/* Address Placeholder */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-xs text-slate-600 font-medium text-right">
                    {selectedBranch
                      ? selectedBranchData?.address || "Address not available"
                      : "Select a branch"}
                  </div>
                </div>
              </div>
            </HorizontalSetupCard>
            {/* Service */}
            <HorizontalSetupCard id="service-card" step={2} currentStep={currentStep} title="Service" icon={Briefcase}>
              <div className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Briefcase size={14} strokeWidth={2} />
                  </div>
                  <select value={selectedService || ""} onChange={e => sel.service(e.target.value)} disabled={!selectedBranch || loadingServices} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{loadingServices ? "Loading…" : "Choose service"}</option>
                    {services.map((service: any) => <option key={service.id} value={service.id}>{service.name} - {service.duration}  ({service.price})</option>)}
                  </select>
                </div>
                {/* Service Details */}
                {selectedService && (() => {
                  const service = services.find((s: any) => s.id === selectedService);
                  if (!service) return null;
                  return (
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="text-xs text-slate-600 font-medium">
                        {service.duration} · {service.price}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </HorizontalSetupCard>
            {/* Professional */}
            <HorizontalSetupCard id="professional-card" step={3} currentStep={currentStep} title="Professional" icon={Users}>
              <div className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={14} strokeWidth={2} />
                  </div>
                  <select value={selectedStaff || ""} onChange={e => sel.staff(e.target.value)} disabled={!selectedService || loadingStaff} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">{loadingStaff ? "Loading…" : "Choose staff"}</option>
                    {assignedStaff.map((staff: any) => <option key={staff.staffId} value={staff.staffId}>{staff.staffName}</option>)}
                  </select>
                </div>
                <label className="flex items-center justify-between px-3 py-2 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={noPreferenceStaff}
                      onChange={(e) => {
                        setNoPreferenceStaff(e.target.checked);
                        if (e.target.checked) setSelectedStaff("");
                      }}
                      disabled={!selectedService}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">No Preference</span>
                  </div>
                </label>
              </div>
            </HorizontalSetupCard>
          </div>
        </div>
        {/* ── Row 2: Calendar + Timeslots | Details ── */}
        <div className="flex gap-5 flex-1 min-h-0">
          {/* Left: Calendar + Timeslots side by side */}
          <div className="flex-1 flex gap-4 min-h-0 items-stretch">
            {/* Calendar */}
            <div id="calendar-card" className={`flex-1 min-h-[32rem] max-h-[32rem] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-opacity ${!selectedStaff && !noPreferenceStaff ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <StepBadge number={4} done={currentStep > 4} active={currentStep === 4} />
                <Calendar size={13} strokeWidth={2} className={currentStep >= 4 ? "text-blue-600" : "text-slate-400"} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStep >= 4 ? "text-blue-700" : "text-slate-400"}`}>
                  Pick a Date
                </span>
                {currentStep === 5 && <span className="ml-auto text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Select</span>}
                {currentStep > 5 && <CheckCircle2 size={11} className="ml-auto text-blue-500" strokeWidth={2.5} />}
              </div>
              <div className="p-4 flex-1">
                {/* Month nav */}
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
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {DAY_LABELS.map((d: string, i: number) => <div key={i} className="text-[9px] font-bold text-slate-400 py-1">{d}</div>)}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: (firstDay + 6) % 7 }).map((_: any, i: number) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_: any, i: number) => {
                    const day = i + 1;
                    const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSel = selectedDate?.day === day && selectedDate?.month === month && selectedDate?.year === year;
                    const hasTime = isSel && selectedTime;
                    return (
                      <button
                        key={day}
                        disabled={isPast || (!selectedStaff && !noPreferenceStaff)}
                        onClick={() => sel.date({ day, month, year })}
                        className={`aspect-square flex items-center justify-center text-xs rounded-xl transition-all relative
                          ${isPast ? "text-slate-200 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}
                          ${isSel ? "!bg-blue-600 !text-white font-bold shadow-md shadow-blue-200" : ""}
                          ${isToday && !isSel ? "font-bold text-blue-600 ring-2 ring-blue-200 ring-offset-1" : (!isSel ? "text-slate-600" : "")}
                        `}
                      >
                        {day}
                        {hasTime && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Timeslots Panel — inline beside calendar */}
            <div id="timeslot-card" className={`flex-1 min-h-[32rem] max-h-[32rem] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-opacity ${!selectedStaff && !noPreferenceStaff ? "opacity-40 pointer-events-none" : ""}`}>
              <TimeslotPanel
                selectedDate={selectedDate}
                timeslots={timeslots}
                loading={loadingTimeslots}
                selectedTime={selectedTime}
                onSelectTime={(time) => setSelectedTime(time)}
                currentStep={currentStep}
              />
            </div>
          </div>

          {/* Right: Your Details */}
          <div id="details-card" className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pb-2">

            <div className={`transition-opacity ${(!selectedTime || selectedTimeWarning) ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <StepBadge number={6} done={false} active={currentStep === 6} />
                  <User size={13} strokeWidth={2} className="text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Personal Details</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <FieldLabel>Full Name *</FieldLabel>
                    <FieldInput icon={User} value={customerName} onChange={(e: any) => setCustomerName(e.target.value)} placeholder="Legal full name" disabled={!selectedTime} />
                  </div>
                  <div>
                    <FieldLabel>Email Address *</FieldLabel>
                    <FieldInput icon={Mail} type="email" value={customerEmail} onChange={(e: any) => setCustomerEmail(e.target.value)} placeholder="your@email.com" disabled={!selectedTime} />
                  </div>
                  <div>
                    <FieldLabel>Mobile Number</FieldLabel>
                    <FieldInput icon={Phone} type="tel" value={customerPhone} onChange={(e: any) => setCustomerPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" disabled={!selectedTime} />
                  </div>
                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <FieldTextarea
                      rows={3}
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                      placeholder="Note for the clinic, e.g. reason for visit, etc."
                      disabled={!selectedTime}
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={!isFormValid || otpSendLoading}
                onClick={handleRequestOtp}
                className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl
                  transition-all shadow-xl shadow-blue-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5"
              >
                {otpSendLoading
                  ? <><Spinner size={18} /> Sending code…</>
                  : <><ShieldCheck size={18} strokeWidth={2.5} /> Book Appointment</>
                }
              </button>

              {!isFormValid && (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  {!selectedTime
                    ? "Select a date and time slot to continue"
                    : selectedTimeWarning
                      ? "Selected slot cannot be booked. Choose another time."
                      : "Full name and email are required"
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── MOBILE LAYOUT ──────────────────────────────────────────────────── */}
      <div className="md:hidden flex-1 flex flex-col">
        <div className="flex border-b border-slate-100 bg-white top-[104px] z-30">
          {[
            { id: "select", label: "Setup", done: currentStep > 4 },
            { id: "schedule", label: "Schedule", done: currentStep > 6 },
            { id: "details", label: "Details", done: false },
          ].map((tab: any) => (
            <button key={tab.id} onClick={() => setMobilePanel(tab.id)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all relative
                ${mobilePanel === tab.id ? "text-blue-600" : "text-slate-400"}`}>
              {tab.done ? <CheckCircle2 size={10} strokeWidth={3} className="inline mr-1 text-blue-500" /> : null}
              {tab.label}
              {mobilePanel === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-8">
          {/* Mobile: Setup tab — vertical cards */}
          {mobilePanel === "select" && (
            <div className="space-y-3">
              {[
                {
                  step: 1, title: "Location", icon: MapPin, cardId: "mobile-location-card", content: (
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                        <MapPin size={14} strokeWidth={2} />
                      </div>
                      <select value={selectedBranch || ""} onChange={e => sel.branch(e.target.value)} disabled={loadingBranches} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{loadingBranches ? "Loading…" : "Choose branch"}</option>
                        {branches.map((branch: any) => <option key={branch.code} value={branch.code}>{branch.description}</option>)}
                      </select>
                    </div>
                  )
                },
                {
                  step: 2, title: "Service", icon: Briefcase, cardId: "mobile-service-card", content: (
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                        <Briefcase size={14} strokeWidth={2} />
                      </div>
                      <select value={selectedService || ""} onChange={e => sel.service(e.target.value)} disabled={!selectedBranch || loadingServices} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{loadingServices ? "Loading…" : "Choose service"}</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.duration}  ({s.price})</option>)}
                      </select>
                    </div>
                  )
                },
                {
                  step: 3, title: "Professional", icon: Users, cardId: "mobile-professional-card", content: (
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                          <User size={14} strokeWidth={2} />
                        </div>
                        <select value={selectedStaff || ""} onChange={e => sel.staff(e.target.value)} disabled={!selectedService || loadingStaff} className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="">{loadingStaff ? "Loading…" : "Choose staff"}</option>
                          {assignedStaff.map((staff: any) => <option key={staff.staffId} value={staff.staffId}>{staff.staffName}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={noPreferenceStaff}
                          onChange={(e) => {
                            setNoPreferenceStaff(e.target.checked);
                            if (e.target.checked) setSelectedStaff("");
                          }}
                          disabled={!selectedService}
                          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-700">No Preference</span>
                      </label>
                    </div>
                  )
                },
              ].map((card) => (
                <HorizontalSetupCard key={card.step} id={card.cardId} step={card.step} currentStep={currentStep} title={card.title} icon={card.icon}>
                  {card.content}
                </HorizontalSetupCard>
              ))}
            </div>
          )}
          {/* Mobile: Schedule tab — calendar + timeslots stacked */}
          {mobilePanel === "schedule" && (
            <div className={`space-y-4 ${!selectedStaff && !noPreferenceStaff ? "opacity-40 pointer-events-none" : ""}`}>
              {/* Calendar */}
              <div id="mobile-calendar-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                    {DAY_LABELS.map((d: string, i: number) => <div key={i} className="text-[9px] font-bold text-slate-400 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: (firstDay + 6) % 7 }).map((_: any, i: number) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_: any, i: number) => {
                      const day = i + 1;
                      const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const isSel = selectedDate?.day === day && selectedDate?.month === month && selectedDate?.year === year;
                      return (
                        <button key={day} disabled={isPast || (!selectedStaff && !noPreferenceStaff)} onClick={() => sel.date({ day, month, year })}
                          className={`aspect-square flex items-center justify-center text-xs rounded-xl transition-all
                            ${isPast ? "text-slate-200 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}
                            ${isSel ? "!bg-blue-600 !text-white font-bold shadow-md shadow-blue-200" : ""}
                            ${isToday && !isSel ? "font-bold text-blue-600 ring-2 ring-blue-200 ring-offset-1" : (!isSel ? "text-slate-600" : "")}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Timeslots panel on mobile — full width below calendar */}
              <div id="mobile-timeslot-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
                <TimeslotPanel
                  selectedDate={selectedDate}
                  timeslots={timeslots}
                  loading={loadingTimeslots}
                  selectedTime={selectedTime}
                  onSelectTime={(time) => setSelectedTime(time)}
                  currentStep={currentStep}
                />
              </div>
            </div>
          )}
          {/* Mobile: Details tab */}
          {mobilePanel === "details" && (
            <div className={`space-y-4 ${(!selectedTime || selectedTimeWarning) ? "opacity-40 pointer-events-none" : ""}`}>
              {(selectedTime && selectedDate) && (
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white">
                  <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={10} /> Booking Summary
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                      <MapPin size={13} strokeWidth={2} />
                      {selectedBranchObj?.description ?? selectedBranch ?? "—"}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                      <Briefcase size={13} strokeWidth={2} />
                      {selectedServiceObj?.name ?? "—"}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                      <User size={13} strokeWidth={2} />
                      {selectedStaffObj?.staffName ?? selectedStaffObj?.staffCode ?? selectedStaff ?? "—"}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                      <Calendar size={13} strokeWidth={2} />
                      {MONTH_NAMES[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                      <Clock size={13} strokeWidth={2} />
                      {selectedTime}
                    </div>
                  </div>
                </div>
              )}
              <div id="mobile-details-card" className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <StepBadge number={6} done={false} active={currentStep === 6} />
                  <User size={13} strokeWidth={2} className="text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Personal Details</span>
                </div>
                <div className="p-4 space-y-3">
                  <div><FieldLabel>Full Name *</FieldLabel><FieldInput icon={User} value={customerName} onChange={(e: any) => setCustomerName(e.target.value)} placeholder="Legal full name" disabled={!selectedTime} /></div>
                  <div><FieldLabel>Email Address *</FieldLabel><FieldInput icon={Mail} type="email" value={customerEmail} onChange={(e: any) => setCustomerEmail(e.target.value)} placeholder="your@email.com" disabled={!selectedTime} /></div>
                  <div><FieldLabel>Mobile Number</FieldLabel><FieldInput icon={Phone} type="tel" value={customerPhone} onChange={(e: any) => setCustomerPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" disabled={!selectedTime} /></div>
                  <div><FieldLabel>Notes</FieldLabel><FieldTextarea rows={3} value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Note for the clinic..." disabled={!selectedTime} /></div>
                </div>
              </div>
              <button disabled={!isFormValid || otpSendLoading} onClick={handleRequestOtp}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl
                  transition-all shadow-xl shadow-blue-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5">
                {otpSendLoading ? <><Spinner size={18} /> Sending code…</> : <><ShieldCheck size={18} strokeWidth={2.5} /> Book Appointment</>}
              </button>
              {!isFormValid && <p className="text-[11px] text-slate-400 text-center">{!selectedTime ? "Select a date and time slot to continue" : selectedTimeWarning ? "Selected slot cannot be booked. Choose another time." : "Full name and email are required"}</p>}
            </div>
          )}
        </div>
        {/* Mobile bottom CTA */}
        {mobilePanel !== "details" && currentStep > 1 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3">
            {mobilePanel === "select" && currentStep >= 5 && (
              <button onClick={() => setMobilePanel("schedule")}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                Choose Date & Time <ArrowRight size={15} />
              </button>
            )}
            {mobilePanel === "schedule" && currentStep >= 6 && (
              <button onClick={() => setMobilePanel("details")}
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                Fill in Details <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      {/* ── OTP Dialog ──────────────────────────────────────────────────────── */}
      <OtpDialog open={otpDialogOpen} email={customerEmail} loading={verifyLoading} timeRemaining={otpTimeRemaining}
        otpValidityPeriod={otpValidityPeriod} canResend={canResend} onVerify={handleVerifyOtp} onResend={handleResendOtp} onClose={() => setOtpDialogOpen(false)} />
      {/* ── Confirm Dialog ──────────────────────────────────────────────────── */}
      <ConfirmDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={handleBooking} loading={isBookingLoading} data={confirmData} />
    </div>
  );
}
