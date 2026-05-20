"use client";

import { useEffect, useState } from "react";
import { usePageActivation } from "@/hooks/use-page-activation";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, Eye } from "lucide-react";
import moment from "moment";
import {
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";

interface Appointment {
  EntryNo: number | string;
  BookingStartDate: string;
  BookingEndDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingNote: string;
  BookingStatus: string;
  BookingSetupCode: string;
  ServiceCode: string;
  ServiceName: string;
  StaffCode: string;
  StaffName: string;
  CustomerNo: string;
  Name: string;
  Name2: string;
  PhoneNo: string;
  EMail: string;
  Age: number;
  BirthDate: string;
  Address: string;
  Address2: string;
}

interface SessionUser {
  customer_number: string;
  name: string;
  role: string;
  email: string;
}

const formatDate = (date?: string) =>
  date ? moment(date).format("MMM DD, YYYY") : "—";

const formatTime = (time?: string) =>
  time ? moment(time, ["HH:mm:ss", "HH:mm"]).format("h:mm A") : "—";

const formatDateTime = (appointment: Appointment) => {
  const date = formatDate(appointment.BookingStartDate);
  const start = formatTime(appointment.BookingStartTime);
  const end = formatTime(appointment.BookingEndTime);
  return `${date} · ${start} — ${end}`;
};

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Completed: "bg-sky-100 text-sky-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function Page() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const loadSession = async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        setError("Unable to load user session.");
        return;
      }
      const data = await res.json();
      setSessionUser(data.user ?? null);
    } catch (err) {
      console.error(err);
      setError("Unable to load user session.");
    }
  };

  const loadAppointments = async (customerNo: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/booking-entry/get-customer-booking-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerNo }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to load appointments.");
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected appointment response.");
      }
      setAppointments(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!sessionUser?.customer_number) return;
    loadAppointments(sessionUser.customer_number);
  }, [sessionUser]);

  usePageActivation(() => {
    loadSession();
    if (sessionUser?.customer_number) {
      loadAppointments(sessionUser.customer_number);
    }
  });

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDialog(true);
  };

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "ServiceName",
      header: "Service",
    },
    {
      id: "datetime",
      header: "Date & Time",
      cell: ({ row }) => <span>{formatDateTime(row.original)}</span>,
    },
    {
      accessorKey: "StaffName",
      header: "Staff",
    },
    {
      accessorKey: "BookingStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.BookingStatus || "—";
        const styles = statusStyles[status] ?? "bg-slate-100 text-slate-700";
        return (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDetails(row.original)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      ),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Appointments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">My appointments</p>
                <h1 className="text-2xl font-bold text-slate-900">Upcoming bookings</h1>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
          ) : (
            <DataTable columns={columns} data={appointments} />
          )}
        </div>
      </div>

<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">

    {/* Header */}
    <DialogHeader className="px-5 py-4 border-b border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            {selectedAppointment?.ServiceName || "Booking Details"}

            {selectedAppointment?.BookingStatus && (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                  selectedAppointment.BookingStatus === "Active"
                    ? "bg-green-100 text-green-700"
                    : selectedAppointment.BookingStatus === "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : selectedAppointment.BookingStatus === "Finalized"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {selectedAppointment.BookingStatus}
              </span>
            )}
          </DialogTitle>

          <DialogDescription className="text-xs text-slate-500 mt-1">
            View appointment details for this booking.
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    {/* Body */}
    {selectedAppointment ? (
      <div className="px-5 py-4 space-y-5">

        {/* Appointment Info */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Appointment Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                Date
              </div>
              <p className="text-sm font-medium text-slate-900">
                {formatDate(selectedAppointment.BookingStartDate)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <ClockIcon className="w-3.5 h-3.5" />
                Time
              </div>
              <p className="text-sm font-medium text-slate-900">
                {formatTime(selectedAppointment.BookingStartTime)}
                {" — "}
                {formatTime(selectedAppointment.BookingEndTime)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <UserIcon className="w-3.5 h-3.5" />
                Staff
              </div>
              <p className="text-sm font-medium text-slate-900">
                {selectedAppointment.StaffName ||
                  selectedAppointment.StaffCode ||
                  "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                Location
              </div>
              <p className="text-sm font-medium text-slate-900">
                {selectedAppointment.BookingSetupCode || "—"}
              </p>
            </div>

          </div>
        </div>

        {/* Customer */}
        <div className="border-t border-slate-100 pt-5 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Customer Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="flex items-start gap-2 text-sm text-slate-800">
              <UserIcon className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {selectedAppointment.Name || "—"}
              </span>
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-800">
              <PhoneIcon className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span>{selectedAppointment.PhoneNo || "—"}</span>
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-800">
              <MailIcon className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {selectedAppointment.EMail || "—"}
              </span>
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-800">
              <MapPinIcon className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                {`${selectedAppointment.Address || ""} ${
                  selectedAppointment.Address2 || ""
                }`.trim() || "—"}
              </span>
            </div>

          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-slate-100 pt-5 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Notes
          </h3>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-line min-h-[72px]">
            {selectedAppointment.BookingNote || "No additional notes provided."}
          </div>
        </div>

      </div>
    ) : (
      <div className="px-5 py-10 text-center text-sm text-slate-500">
        No appointment selected.
      </div>
    )}

    {/* Footer */}
    <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">

      {selectedAppointment?.BookingStatus === "Active" && (
        <button
          onClick={() => {
            if (!selectedAppointment) return;
            window.location.href = `/book-now?reschedule=${selectedAppointment.EntryNo}`;
          }}
          className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm transition hover:bg-blue-700"
        >
          Reschedule
        </button>
      )}

      <div className="ml-auto">
        <button
          onClick={() => setShowDialog(false)}
          className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg transition hover:bg-slate-200"
        >
          Close
        </button>
      </div>

    </div>

  </DialogContent>
</Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="font-semibold text-gray-700">{label}: </span>
      <span className="text-gray-600">{value}</span>
    </div>
  );
}
