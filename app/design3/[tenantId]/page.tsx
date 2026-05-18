"use client";
import { useState, useEffect, useCallback, useMemo, use } from "react";
import {
  CheckCircle2, MapPin, Briefcase, User, Calendar, Clock, Phone, Mail, 
  FileText, ShieldCheck, ChevronRight, X, Info, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ─── Local Mock UI Utilities ────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
);

const Input = ({ icon: Icon, label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} strokeWidth={2.5} />
      )}
      <input
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm`}
        {...props}
      />
    </div>
  </div>
);

const Button = ({ className, children, variant = "primary", ...props }: any) => {
  const variants = {
    primary: "bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 bg-white text-slate-600 hover:border-indigo-500 hover:text-indigo-600",
  };

  return (
    <button
      className={`px-6 py-3.5 rounded-2xl font-black text-xs tracking-tight transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ─── Constants & Types ────────────────────────────────────────────────────────

const sileo = {
  error: (msg: any) => alert(`Error: ${msg.title}`),
  success: (msg: any) => alert(`Success: ${msg.title}`)
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface DateObj { day: number; month: number; year: number; }
interface Branch { code: string; description: string; }
interface Service { id: string; code: string; name: string; duration: string; price: string; }
interface Staff { staffId: string; staffCode: string; staffName: string; }
interface Room { id: string; code: string; name: string; }
interface Timeslot { id: string; time: string; availability: string; allowBooking: string; }

// ─── Main Application ────────────────────────────────────────────────────────

export default function App() {
  const tenantId = "demo-tenant";

  // Data Store
  const [org, setOrg] = useState({ name: "Central Booking", loading: true });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  
  // App State
  const [loading, setLoading] = useState({ branches: false, services: false, staff: false, rooms: false, timeslots: false, booking: false });
  const [selections, setSelections] = useState({ branch: "", service: "", staff: "", room: "", date: null as DateObj | null, time: "" });
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", notes: "" });
  const [step, setStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  // Derived
  const selectedBranchObj = branches.find(b => b.code === selections.branch);
  const selectedServiceObj = services.find(s => s.id === selections.service);
  const selectedStaffObj = assignedStaff.find(s => s.staffId === selections.staff);
  const selectedRoomObj = rooms.find(r => r.id === selections.room);

  // API Interactions
  const fetchOrg = async () => {
    try {
      const res = await fetch(`/api/booking-organization-setup?tenantId=${tenantId}`);
      const data = await res.json();
      setOrg({ name: data[0]?.Name || "Health Center", loading: false });
    } catch { setOrg(p => ({ ...p, loading: false })); }
  };

  const fetchBranches = async () => {
    setLoading(l => ({ ...l, branches: true }));
    try {
      const res = await fetch("/api/booking-branch-setup/get-booking-setup-list");
      const data = await res.json();
      setBranches((Array.isArray(data) ? data : []).map((b: any) => ({ code: b.Code, description: b.Description })));
    } finally { setLoading(l => ({ ...l, branches: false })); }
  };

  const fetchServices = useCallback(async () => {
    if (!selections.branch) return;
    setLoading(l => ({ ...l, services: true }));
    try {
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selections.branch}`);
      const data = await res.json();
      const param = data[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 1);
      setServices(param?.BookingParameterValue?.map((s: any) => ({
        id: String(s.BookingParameterValueId),
        code: s.BookingParameterValueCode,
        name: s.BookingParameterValueDescription,
        duration: `${Math.round(s.BookingParameterValueDuration / 60)} hr/s`,
        price: s.BookingParameterValuePrice || "0",
      })) ?? []);
    } finally { setLoading(l => ({ ...l, services: false })); }
  }, [selections.branch]);

  const fetchStaff = useCallback(async () => {
    if (!selections.branch || !selections.service) return;
    setLoading(l => ({ ...l, staff: true }));
    try {
      const res = await fetch("/api/booking-staff-rela/get-booking-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingSetupCode: selections.branch, serviceId: selections.service }),
      });
      const data = await res.json();
      setAssignedStaff((Array.isArray(data) ? data : []).map((s: any) => ({ staffId: String(s.StaffId), staffCode: s.StaffCode, staffName: s.StaffName })));
    } finally { setLoading(l => ({ ...l, staff: false })); }
  }, [selections.branch, selections.service]);

  const fetchRooms = useCallback(async () => {
    if (!selections.branch) return;
    setLoading(l => ({ ...l, rooms: true }));
    try {
      const res = await fetch(`/api/booking-branch-setup/get-booking-setup?code=${selections.branch}`);
      const data = await res.json();
      const param = data[0]?.BookingParameter?.find((p: any) => p.BookingParameterId === 3);
      setRooms(param?.BookingParameterValue?.map((r: any) => ({
        id: String(r.BookingParameterValueId),
        code: r.BookingParameterValueCode,
        name: r.BookingParameterValueDescription,
      })) ?? []);
    } finally { setLoading(l => ({ ...l, rooms: false })); }
  }, [selections.branch]);

  const fetchTimeslots = useCallback(async () => {
    if (!selections.date || !selections.branch) return;
    setLoading(l => ({ ...l, timeslots: true }));
    try {
      const formattedDate = `${String(selections.date.month + 1).padStart(2, "0")}/${String(selections.date.day).padStart(2, "0")}/${String(selections.date.year).slice(-2)}`;
      const res = await fetch("/api/available-timeslot/get-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selections.branch,
          bookingDate: formattedDate,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selections.staff}|${selections.service}|${selections.room}`,
          skipTimeSlotAvailabilityCheck: "false",
        }),
      });
      const data = await res.json();
      setTimeslots((Array.isArray(data) ? data : []).map((sl: any) => ({
        id: sl.Id,
        time: new Date(`1970-01-01T${sl.Time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        availability: sl.IsAvailable,
        allowBooking: sl.AllowBooking,
      })));
    } finally { setLoading(l => ({ ...l, timeslots: false })); }
  }, [selections]);

  const handleBookingFinalize = async () => {
    setLoading(l => ({ ...l, booking: true }));
    try {
      const formattedDate = `${String(selections.date!.month + 1).padStart(2, "0")}/${String(selections.date!.day).padStart(2, "0")}/${selections.date!.year}`;
      const res = await fetch("/api/available-timeslot/book-available-timeslot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: selections.branch,
          bookingDate: formattedDate,
          bookingStartTime: selections.time,
          bookingParameterCount: "3",
          bookingParameterIDs: "1|2|3",
          bookingParameterValueIDs: `${selections.staff}|${selections.service}|${selections.room}`,
          bookingNote: customer.notes,
          customerNoOrEmailAdd: customer.email,
          customerName: customer.name,
          customerPhoneNo: customer.phone,
          skipTimeSlotAvailabilityCheck: "false",
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Booking Confirmed Successfully!" });
      setSelections({ branch: "", service: "", staff: "", room: "", date: null, time: "" });
      setCustomer({ name: "", email: "", phone: "", notes: "" });
      setStep(1); setShowSummary(false);
    } catch { sileo.error({ title: "System Error. Please try again." }); }
    finally { setLoading(l => ({ ...l, booking: false })); }
  };

  // Effects
  useEffect(() => { fetchOrg(); fetchBranches(); }, []);
  useEffect(() => { if (selections.branch) { fetchServices(); fetchRooms(); } }, [selections.branch, fetchServices, fetchRooms]);
  useEffect(() => { if (selections.service && selections.branch) fetchStaff(); }, [selections.service, selections.branch, fetchStaff]);
  useEffect(() => { if (selections.date && selections.branch && selections.staff && selections.room) fetchTimeslots(); }, [selections, fetchTimeslots]);

  // Navigation Logic
  const handleSelectBranch = (code: string) => { 
    setSelections({ ...selections, branch: code, service: "", staff: "", room: "", date: null, time: "" });
    setStep(2);
  };
  const handleSelectService = (id: string) => {
    setSelections({ ...selections, service: id, staff: "", room: "", date: null, time: "" });
    setStep(3);
  };
  const handleSelectStaff = (id: string) => {
    setSelections({ ...selections, staff: id, date: null, time: "" });
    setStep(4);
  };
  const handleSelectRoom = (id: string) => {
    setSelections({ ...selections, room: id, date: null, time: "" });
    setStep(5);
  };
  const handleSelectDate = (d: DateObj) => {
    setSelections({ ...selections, date: d, time: "" });
  };
  const handleSelectTime = (t: string) => {
    setSelections({ ...selections, time: t });
    setShowSummary(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Simple Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={18} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black tracking-tight">{org.loading ? "..." : org.name}</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Stable Connection</span>
           </div>
           <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Info size={18} />
           </button>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-6">
        <div className="max-w-[560px] mx-auto">
          
          {/* Progress Indication */}
          <div className="mb-12 flex items-center justify-between px-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">Schedule Visit</h2>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Step {step} of 5</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.3)]" : "bg-slate-200"}`} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <OptionHeader title="Select Branch" icon={MapPin} />
                <div className="grid grid-cols-1 gap-3">
                  {loading.branches ? [1,2].map(i => <Skeleton key={i} className="h-20" />) : (
                    branches.map(b => (
                      <CardItem 
                        key={b.code} 
                        title={b.description} 
                        subtitle={`Facility ID: ${b.code}`}
                        active={selections.branch === b.code}
                        onClick={() => handleSelectBranch(b.code)}
                        icon={MapPin}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <OptionHeader title="Select Service" icon={Briefcase} onBack={() => setStep(1)} />
                <div className="grid grid-cols-1 gap-3">
                  {loading.services ? [1,2,3].map(i => <Skeleton key={i} className="h-20" />) : (
                    services.map(s => (
                      <CardItem 
                        key={s.id} 
                        title={s.name} 
                        subtitle={`${s.duration} • $${s.price}`}
                        active={selections.service === s.id}
                        onClick={() => handleSelectService(s.id)}
                        icon={Briefcase}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <OptionHeader title="Assigned Specialist" icon={User} onBack={() => setStep(2)} />
                <div className="grid grid-cols-1 gap-3">
                  {loading.staff ? [1,2].map(i => <Skeleton key={i} className="h-20" />) : (
                    assignedStaff.map(s => (
                      <CardItem 
                        key={s.staffId} 
                        title={s.staffCode} 
                        subtitle="Primary Physician / Staff"
                        active={selections.staff === s.staffId}
                        onClick={() => handleSelectStaff(s.staffId)}
                        icon={User}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <OptionHeader title="Facility Resource" icon={ShieldCheck} onBack={() => setStep(3)} />
                <div className="grid grid-cols-1 gap-3">
                  {loading.rooms ? [1,2,3].map(i => <Skeleton key={i} className="h-20" />) : (
                    rooms.map(r => (
                      <CardItem 
                        key={r.id} 
                        title={r.name} 
                        subtitle={`Registered Room Code: ${r.code}`}
                        active={selections.room === r.id}
                        onClick={() => handleSelectRoom(r.id)}
                        icon={ShieldCheck}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <OptionHeader title="Appointment Slot" icon={Clock} onBack={() => setStep(4)} />
                
                <div className="space-y-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calendar Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-[14px] font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                        onChange={(e) => {
                          const d = new Date(e.target.value);
                          handleSelectDate({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear() });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Windows</label>
                    <div className="grid grid-cols-2 gap-2">
                       {loading.timeslots ? [1,2,3,4].map(i => <Skeleton key={i} className="h-12" />) : (
                         timeslots.filter(t => t.availability === 'Yes').map(t => (
                           <button 
                            key={t.id}
                            onClick={() => handleSelectTime(t.time)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${selections.time === t.time ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'}`}
                           >
                             {t.time}
                           </button>
                         ))
                       )}
                       {!loading.timeslots && timeslots.filter(t => t.availability === 'Yes').length === 0 && (
                         <div className="col-span-2 py-8 text-center text-slate-400 text-[11px] font-bold italic">
                           {selections.date ? "No slots for this date." : "Please select a date first."}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secure Footer Info */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col items-center gap-6 opacity-30">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Lock size={12} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-widest">TLS 1.3</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-widest">HIPAA Compliant</span>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Summary / Confirmation Drawer (Modern Sheet style) */}
      <AnimatePresence>
        {showSummary && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSummary(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[70] p-8 max-h-[90vh] overflow-y-auto shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.1)]"
            >
              <div className="max-w-[500px] mx-auto space-y-8 pb-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Review Details</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Summary of medical appointment</p>
                  </div>
                  <button onClick={() => setShowSummary(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <SummaryRow label="Patient Request" value={selectedServiceObj?.name} />
                  <SummaryRow label="Schedule" value={selections.date ? `${MONTH_NAMES[selections.date.month]} ${selections.date.day} • ${selections.time}` : "-"} />
                  <SummaryRow label="Professional" value={selectedStaffObj?.staffCode} />
                  <SummaryRow label="Location" value={selectedBranchObj?.description} />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Protocol</p>
                  <Input placeholder="Full Legal Name" value={customer.name} onChange={(e: any) => setCustomer({...customer, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Email Address" type="email" value={customer.email} onChange={(e: any) => setCustomer({...customer, email: e.target.value})} />
                    <Input placeholder="Mobile Number" type="tel" value={customer.phone} onChange={(e: any) => setCustomer({...customer, phone: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button 
                    className="h-16 w-full" 
                    disabled={!customer.name || !customer.email || loading.booking}
                    onClick={handleBookingFinalize}
                  >
                    {loading.booking ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="animate-pulse">PROCESSING RECORDS</span>
                      </div>
                    ) : (
                      <>
                        <ShieldCheck size={20} strokeWidth={3} />
                        CONFIRM APPOINTMENT
                      </>
                    )}
                  </Button>
                  <p className="text-[9.5px] text-center text-slate-400 font-medium px-8 leading-relaxed">
                    By confirming, you authorize our medical staff to secure this time slot. Patient records are handled under strict HIPAA privacy protocols.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component Atoms ─────────────────────────────────────────────────────────

function CardItem({ title, subtitle, active, onClick, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-5 text-left rounded-3xl transition-all duration-300 group flex items-center gap-4 border-2
        ${active 
          ? "bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-900/10 scale-[1.02]" 
          : "bg-white border-white text-slate-600 hover:border-indigo-500/20 hover:shadow-lg hover:shadow-slate-200/50"
        }
      `}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
        ${active ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
      `}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>
          {title}
        </h4>
        <p className={`text-[11px] font-bold uppercase tracking-widest ${active ? 'text-indigo-400/80' : 'text-slate-400'}`}>
          {subtitle}
        </p>
      </div>
      <div className={`transition-all duration-300 ${active ? 'text-white' : 'text-slate-200 group-hover:text-indigo-500 translate-x-0 opacity-0 group-hover:opacity-100'}`}>
        <ChevronRight size={20} />
      </div>
    </button>
  );
}

function OptionHeader({ title, icon: Icon, onBack }: { title: string, icon: any, onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-black tracking-tight text-slate-800">{title}</h3>
      </div>
      {onBack && (
        <button onClick={onBack} className="text-[10px] font-black text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1.5">
          <span className="mb-0.5">←</span> Back
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string, value?: string | null }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">{value || "—"}</span>
    </div>
  );
}
