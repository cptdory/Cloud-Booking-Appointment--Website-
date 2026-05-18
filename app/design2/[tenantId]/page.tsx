/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import {
  CheckCircle2, MapPin, Briefcase, Users, Calendar, User,
  Clock, Phone, Mail, Home, FileText, Lock, Info, RefreshCw, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight
} from "lucide-react";

// ─── Local Mock Components / Utilities ────────────────────────────────────────

const Skeleton = ({ className, ...props }: { className?: string, [key: string]: any }) => (
  <div className={`animate-pulse bg-slate-50 rounded-lg ${className}`} {...props} />
);

const Input = ({ className, ...props }: any) => (
  <input
    className={`w-full px-4 py-3 border border-slate-100 rounded-xl text-[13px] font-semibold bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-300 placeholder:font-medium ${className}`}
    {...props}
  />
);

const Textarea = ({ className, ...props }: any) => (
  <textarea
    className={`w-full px-4 py-3 border border-slate-100 rounded-xl text-[13px] font-semibold bg-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all min-h-[60px] resize-none placeholder:text-slate-300 placeholder:font-medium ${className}`}
    {...props}
  />
);

const Label = ({ className, children, ...props }: any) => (
  <label className={`block text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-[0.2em] ${className}`} {...props}>
    {children}
  </label>
);

const Button = ({ className, children, variant = "primary", ...props }: any) => {
  if (variant === "primary") {
    return (
      <button
        className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm cursor-pointer shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:shadow-[0_15px_25px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2.5 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border ${
        variant === "outline" 
          ? "border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 shadow-sm hover:shadow-md"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Mocking sileo since it's not in package.json
const sileo = {
  error: ({ title }: { title: string }) => {
    alert(`Error: ${title}`);
  },
  success: ({ title }: { title: string }) => {
    alert(`Success: ${title}`);
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateObj { day: number; month: number; year: number; }
interface Branch { code: string; description: string; }
interface Service { id: string; code: string; name: string; duration: string; price: string; }
interface Staff { staffId: string; staffCode: string; staffName: string; }
interface Room { id: string; code: string; name: string; }
interface Timeslot { id: string; time: string; availability: string; allowBooking: string; }

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children, isActive }: { children: ReactNode, isActive?: boolean }) {
  return (
    <div className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-between mb-3 transition-all duration-500 ${isActive ? "text-blue-600 translate-x-1" : "text-slate-400"}`}>
      <div className="flex items-center gap-2">
        <div className={`w-1 h-3 rounded-full transition-all duration-500 ${isActive ? "bg-blue-600 scale-y-125 shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "bg-slate-200"}`} />
        {children}
      </div>
      {isActive ? (
        <div className="flex items-center gap-1.5 animate-pulse bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-blue-100">
          <div className="w-1 h-1 bg-blue-600 rounded-full" />
          <span className="text-[9px] font-black text-blue-600 tracking-widest">ACTIVE</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-20">
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="text-[8px] font-black tracking-widest uppercase">Next</span>
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, placeholder, disabled, loading, icon: Icon }: any) {
  return (
    <div className="relative group">
      {Icon && (
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${value ? "text-blue-500" : "text-slate-400"}`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-10 py-3 border rounded-xl text-[13px] font-semibold bg-white transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm
          ${value 
            ? "border-blue-200 text-slate-900 bg-blue-50/10 ring-1 ring-blue-100/50" 
            : "border-slate-200 text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50"
          }`}
      >
        <option value="" disabled>{loading ? "Updating list..." : placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.id || opt.code || opt.staffId} value={opt.id || opt.code || opt.staffId}>
            {opt.name || opt.code || opt.staffCode || opt.description}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-slate-400 transition-colors">
        <ChevronDown size={16} strokeWidth={3} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

  // ── Org setup ────────────────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgSetupLoading, setOrgSetupLoading] = useState(true);

  // ── Loading ──────────────────────────────────────────────────────────────────
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

  // ── Selections ───────────────────────────────────────────────────────────────
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateObj | null>(null);
  const [selectedTime, setSelectedTime] = useState("");

  // ── Customer form ────────────────────────────────────────────────────────────
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
  const selectedBranchObj = branches.find((b) => b.code === selectedBranch);
  const selectedServiceObj = services.find((s) => s.id === selectedService);
  const selectedStaffObj = assignedStaff.find((s) => s.staffId === selectedStaff);
  const selectedRoomObj = rooms.find((r) => r.id === selectedRoom);

  const isFormValid = customerName !== "" && customerEmail !== "";

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Logic to determine which step is currently "active"
  const currentStep = !selectedBranch ? 1 
    : !selectedService ? 2 
    : !selectedStaff ? 3 
    : !selectedRoom ? 4 
    : !selectedDate ? 5 
    : !selectedTime ? 5 : 6;

  // ─── API Fetchers ─────────────────────────────────────────────────────────────

  const fetchOrgSetup = async () => {
    try {
      const res = await fetch(`/api/booking-organization-setup?tenantId=${tenantId}`);
      const data = await res.json();
      setOrgName(data?.Name ?? "");
      setOrgPhone(data?.Phone ?? "");
    } catch (e: any) {
      console.error("Failed to get organization setup");
    } finally {
      setOrgSetupLoading(false);
    }
  };

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
    if (!selectedBranch) return;
    try {
      setLoadingServices(true);
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selectedBranch}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const param = list[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 1);
      setServices(
        param?.BookingParameterValue?.map((s: any) => ({
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
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAssignedStaff(list.map((s: any) => ({ staffId: String(s.StaffId), staffCode: s.StaffCode, staffName: s.StaffName })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStaff(false);
    }
  }, [selectedBranch, selectedService]);

  const fetchRooms = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      setLoadingRooms(true);
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selectedBranch}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const param = list[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 3);
      setRooms(
        param?.BookingParameterValue?.map((r: any) => ({
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
  }, [selectedBranch]);

  const fetchTimeslots = useCallback(async () => {
    if (!selectedDate || !selectedBranch) return;
    try {
      setLoadingTimeslots(true);
      const formattedDate = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${String(selectedDate.year).slice(-2)}`;
      const res = await fetch("/api/available-timeslot/get-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selectedBranch,
          bookingDate: formattedDate,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selectedStaff}|${selectedService}|${selectedRoom}`,
          skipTimeSlotAvailabilityCheck: "false",
        }),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTimeslots(
        list.map((sl: any) => ({
          id: sl.Id,
          time: new Date(`1970-01-01T${sl.Time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          availability: sl.IsAvailable,
          allowBooking: sl.AllowBooking,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTimeslots(false);
    }
  }, [selectedDate, selectedBranch, selectedStaff, selectedService, selectedRoom]);

  const handleBookAvailableTimeslot = async () => {
    if (!selectedDate || !selectedTime) {
      sileo.error({ title: "Please select both a date and time" });
      return;
    }
    if (!customerName || !customerEmail) {
      sileo.error({ title: "Full Name and Email Address are required" });
      return;
    }
    setIsBookingLoading(true);
    try {
      const formattedDate = `${String(selectedDate.month + 1).padStart(2, "0")}/${String(selectedDate.day).padStart(2, "0")}/${selectedDate.year}`;
      const res = await fetch("/api/available-timeslot/book-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selectedBranch,
          bookingDate: formattedDate,
          bookingStartTime: selectedTime,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selectedStaff}|${selectedService}|${selectedRoom}`,
          bookingNote: notes,
          bookingEntryNo: "",
          customerNoOrEmailAdd: customerEmail,
          customerName,
          customerPhoneNo: customerPhone,
          customerAddress1,
          customerAddress2,
          skipTimeSlotAvailabilityCheck: "false",
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      sileo.success({ title: "Booking confirmed successfully!" });
      // Reset
      setSelectedBranch(""); setSelectedService(""); setSelectedStaff(""); setSelectedRoom("");
      setSelectedDate(null); setSelectedTime("");
      setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
      setCustomerAddress1(""); setCustomerAddress2(""); setNotes("");
    } catch {
      sileo.error({ title: "Booking failed. Please try again." });
    } finally {
      setIsBookingLoading(false);
    }
  };

  // ── Selection Helpers ────────────────────────────────────────────────────────────
  const handleSelectBranch = (code: string) => {
    setSelectedBranch(code);
    setSelectedService(""); setSelectedStaff(""); setSelectedRoom(""); setSelectedDate(null); setSelectedTime("");
  };

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setSelectedStaff(""); setSelectedRoom(""); setSelectedDate(null); setSelectedTime("");
  };

  const handleSelectStaff = (id: string) => {
    setSelectedStaff(id);
    setSelectedDate(null); setSelectedTime("");
  };

  const handleSelectRoom = (id: string) => {
    setSelectedRoom(id);
    setSelectedDate(null); setSelectedTime("");
  };

  const handleSelectDate = (d: DateObj) => {
    setSelectedDate(d);
    setSelectedTime("");
  };

  const handleSelectTime = (t: string) => {
    setSelectedTime(t);
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchOrgSetup(); fetchBranches(); }, []);
  useEffect(() => { if (selectedBranch) fetchServices(); }, [selectedBranch, fetchServices]);
  useEffect(() => { if (selectedService && selectedBranch) fetchStaff(); }, [selectedService, selectedBranch, fetchStaff]);
  useEffect(() => { if (selectedBranch) fetchRooms(); }, [selectedBranch, fetchRooms]);
  useEffect(() => { if (selectedDate && selectedBranch && selectedService && selectedStaff && selectedRoom) fetchTimeslots(); }, [selectedDate, selectedBranch, selectedStaff, selectedService, selectedRoom, fetchTimeslots]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-0 flex flex-col antialiased">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm">
            <Calendar size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            {orgSetupLoading ? "Loading..." : orgName || "Central Clinic Booking"}
          </h1>
        </div>
      </header>

      {/* Main Content: Compact Vertical Flow */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 py-8 px-4">
        <div className="max-w-[480px] mx-auto space-y-4 pb-20">
          
          {/* Step 1-4: Core Selections */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
            <section>
              <SectionTitle isActive={currentStep === 1}>01 Location</SectionTitle>
              <Select 
                value={selectedBranch} 
                onChange={handleSelectBranch}
                options={branches}
                placeholder="Primary Location"
                loading={loadingBranches}
                icon={MapPin}
              />
            </section>

            <section className={`${!selectedBranch ? "opacity-50" : ""} transition-all`}>
              <SectionTitle isActive={currentStep === 2}>02 Dept / Service</SectionTitle>
              <Select 
                value={selectedService} 
                onChange={handleSelectService}
                options={services}
                placeholder="Medical Service"
                loading={loadingServices}
                disabled={!selectedBranch}
                icon={Briefcase}
              />
            </section>

            <section className={`${!selectedService ? "opacity-50" : ""} transition-all`}>
              <SectionTitle isActive={currentStep === 3}>03 Professional</SectionTitle>
              <Select 
                value={selectedStaff} 
                onChange={handleSelectStaff}
                options={assignedStaff.map(s => ({ ...s, id: s.staffId, name: s.staffCode }))}
                placeholder="Staff Assigned"
                loading={loadingStaff}
                disabled={!selectedService}
                icon={User}
              />
            </section>

            <section className={`${!selectedStaff ? "opacity-50" : ""} transition-all`}>
              <SectionTitle isActive={currentStep === 4}>04 Facility</SectionTitle>
              <Select 
                value={selectedRoom} 
                onChange={handleSelectRoom}
                options={rooms}
                placeholder="Room Assignment"
                loading={loadingRooms}
                disabled={!selectedStaff}
                icon={Home}
              />
            </section>
          </div>

          {/* Step 5: Date & Time */}
          <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 ${!selectedRoom ? "opacity-50 pointer-events-none" : ""}`}>
            <SectionTitle isActive={currentStep === 5}>05 Appointment Time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative group">
                <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${selectedDate ? "text-blue-500" : "text-slate-400"}`}>
                  <Calendar size={14} strokeWidth={2.5} />
                </div>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-[13px] font-semibold bg-white transition-all appearance-none cursor-pointer focus:outline-none 
                    ${selectedDate 
                      ? "border-blue-200 text-slate-900 bg-blue-50/10 ring-1 ring-blue-100/50" 
                      : "border-slate-200 text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50"
                    } disabled:opacity-30`}
                  disabled={!selectedRoom}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const d = new Date(e.target.value);
                    handleSelectDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
                  }}
                />
              </div>
              
              <Select 
                value={selectedTime}
                onChange={handleSelectTime}
                options={timeslots.filter(ts => ts.availability === 'Yes').map(ts => ({ id: ts.time, name: ts.time }))}
                placeholder={loadingTimeslots ? "Updating slots..." : "Pick Time"}
                loading={loadingTimeslots}
                disabled={!selectedDate}
                icon={Clock}
              />
            </div>
          </div>

          {/* Action Footer: Simplified trigger */}
          <div className={`transition-all duration-500 pt-4 ${!selectedTime ? "opacity-30 pointer-events-none grayscale" : "translate-y-0"}`}>
            <Button
              className="h-16 bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-200 border-none transition-all active:scale-[0.95] rounded-[2rem]"
              disabled={!selectedTime}
              onClick={() => setShowConfirmation(true)}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} strokeWidth={3} />
                <span className="text-[16px] font-black tracking-tight">REVIEW & COMPLETE</span>
              </div>
            </Button>
            
            <div className="mt-6 flex items-center justify-center gap-8 opacity-20">
               <div className="flex items-center gap-1.5">
                 <Lock size={10} strokeWidth={3} />
                 <span className="text-[8px] font-black uppercase tracking-widest">HIPAA SECURE</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Info size={10} strokeWidth={3} />
                 <span className="text-[8px] font-black uppercase tracking-widest">256-BIT ENCRYPTION</span>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowConfirmation(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-6 border-b border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Finalize Booking</h2>
                  <p className="text-slate-400 text-[12px] font-medium mt-1">Please provide your details to secure the slot.</p>
                </div>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>

              {/* Form Section */}
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} strokeWidth={2.5} />
                  <Input 
                    className="pl-11 h-12 text-[12px]"
                    value={customerName} 
                    onChange={(e: any) => setCustomerName(e.target.value)} 
                    placeholder="Full Legal Name" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} strokeWidth={2.5} />
                    <Input 
                      type="email"
                      className="pl-11 h-12 text-[12px]"
                      value={customerEmail} 
                      onChange={(e: any) => setCustomerEmail(e.target.value)} 
                      placeholder="Email Address" 
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} strokeWidth={2.5} />
                    <Input 
                      type="tel"
                      className="pl-11 h-12 text-[12px]"
                      value={customerPhone} 
                      onChange={(e: any) => setCustomerPhone(e.target.value)} 
                      placeholder="Mobile Number" 
                    />
                  </div>
                </div>
                <Textarea 
                  className="min-h-[70px] text-[12px] p-3 shadow-none border-slate-100"
                  value={notes} 
                  onChange={(e: any) => setNotes(e.target.value)} 
                  placeholder="Additional notes for the medical staff..." 
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3.5 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <FileText size={10} />
                  Appointment Summary
                </h4>
                <SummaryRow label="Schedule" value={selectedDate ? `${MONTH_NAMES[selectedDate.month]} ${selectedDate.day} at ${selectedTime}` : null} />
                <SummaryRow label="Service" value={selectedServiceObj?.name} />
                <SummaryRow label="Professional" value={selectedStaffObj?.staffCode} />
                <SummaryRow label="Location" value={selectedBranchObj?.description || selectedBranch} />
                <SummaryRow label="Facility" value={selectedRoomObj?.name} />
              </div>

              <div className="space-y-3">
                <Button
                  className="h-14 shadow-xl shadow-blue-600/20"
                  disabled={!isFormValid || isBookingLoading}
                  onClick={async () => {
                    await handleBookAvailableTimeslot();
                    setShowConfirmation(false);
                  }}
                >
                  {isBookingLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      SCHEDULING...
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 size={18} strokeWidth={3} />
                      CONFIRM & BOOK NOW
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Refactored UI Components ───────────────────────────────────────────────

function SummaryRow({ label, value, labelColor = "text-slate-400", valueColor = "text-slate-700" }: { label: string, value?: string | null, labelColor?: string, valueColor?: string }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className={`${labelColor} font-medium`}>{label}</span>
      <span className={`font-bold ${valueColor} truncate max-w-[160px]`}>{value || "—"}</span>
    </div>
  );
}

function LoadingPills({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-20 rounded-md" />
      ))}
    </div>
  );
}
