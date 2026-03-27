
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useModalAlert } from "@/hooks/useAlert";
import EventDetailsDialog from "@/components/Booking-Calendar/EventDetailsDialog";
import {
  showErrorAlert,
} from "@/components/Common/SweetAlert";
import { CalendarEvent } from "@/types/calendarEvent";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: "Finalized" | "Active" | "Cancelled";
  serviceName?: string;
  staffName?: string;
}

interface BookingEntry {
  EntryNo: number;
  BookingStartDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingStatus: string;
  ServiceName: string;
  StaffName: string;
  BookingNote: string;
  CustomerNo?: string;
  Name?: string;
  PhoneNo?: string;
  EMail?: string;
  Age?: number;
  Address?: string;
  Address2?: string;
  ServiceCode?: string;
  StaffCode?: string;
  TimeOff?: boolean;
  BookingSetupCode?: string;
  BookingEndDate?: string;
  ServiceType?: string;
  Name2?: string;
  BirthDate?: string;
  [key: string]: any;
}

export default function AppointmentPage() {
  const { customerNo, userRole, staffCode, checkingAuth } = useAuth();
  const { showSuccess: showToastSuccess } = useToast();
  const { showError: showErrorAlert, showConfirm } = useModalAlert();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingEntries, setBookingEntries] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingTimeOff, setIsDeletingTimeOff] = useState(false);

  // Convert BookingEntry to CalendarEvent format
  const convertToCalendarEvent = (entry: BookingEntry): CalendarEvent => {
    const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
    const endDateTime = `${entry.BookingStartDate}T${entry.BookingEndTime}`;

    return {
      id: entry.EntryNo.toString(),
      title: entry.ServiceName || "-",
      start: startDateTime,
      end: endDateTime,
      color: "#3b82f6",
      textColor: "#ffffff",
      extendedProps: {
        description: entry.BookingNote,
        location: entry.Address2 || "-",
        staff: entry.StaffName || entry.StaffCode || "-",
        staffCode: entry.StaffCode || "-",
        staffName: entry.StaffName,
        service: entry.ServiceName || "-",
        customer: entry.Name || entry.CustomerNo || "-",
        status: entry.BookingStatus,
        branch: entry.BookingSetupCode || "MAIN",
        room: entry.Address2 || "-",
        timeOff: entry.TimeOff ?? false,
        rawData: entry as any,
      },
    };
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!customerNo || checkingAuth) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/booking-entry/get-customer-booking-entries",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              _CustomerNo: customerNo,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch appointments"
          );
        }

        const data = await response.json();

        // Parse the stringified JSON response
        let entries: BookingEntry[] = [];
        if (data.data?.value) {
          try {
            entries = JSON.parse(data.data.value);
          } catch (parseError) {
            console.error("Failed to parse booking entries:", parseError);
            throw new Error("Failed to parse appointment data");
          }
        }

        setBookingEntries(entries);

        // Transform API response to Appointment format
        const transformedAppointments: Appointment[] = entries.map(
          (entry) => {
            // Format time (convert 24-hour to 12-hour format)
            const formatTime = (timeStr: string): string => {
              if (!timeStr) return "";
              const [hours, minutes] = timeStr.split(":").slice(0, 2);
              let hour = parseInt(hours, 10);
              const minute = minutes;
              const period = hour >= 12 ? "PM" : "AM";
              if (hour > 12) hour -= 12;
              if (hour === 0) hour = 12;
              return `${hour.toString().padStart(2, "0")}:${minute} ${period}`;
            };

            const startTime = formatTime(entry.BookingStartTime);
            const endTime = formatTime(entry.BookingEndTime);

            return {
              id: entry.EntryNo.toString(),
              date: entry.BookingStartDate,
              time: `${startTime} - ${endTime}`,
              status: entry.BookingStatus as "Finalized" | "Active" | "Cancelled",
              serviceName: entry.ServiceName,
              staffName: entry.StaffName,
            };
          }
        );

        setAppointments(transformedAppointments);
      } catch (err: any) {
        console.error("Error fetching appointments:", err);
        setError(err.message || "Failed to fetch appointments");
        showErrorAlert(
          err.message || "Failed to fetch appointments",
          "Error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [customerNo, checkingAuth]);

  const handleRowClick = (appointmentId: string) => {
    const entry = bookingEntries.find((e) => e.EntryNo.toString() === appointmentId);
    if (entry) {
      const calendarEvent = convertToCalendarEvent(entry);
      setSelectedEvent(calendarEvent);
      setIsModalOpen(true);
    }
  };

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!selectedEvent) return;

      setIsUpdatingStatus(true);
      try {
        const response = await fetch("/api/booking-entry/update-booking-entry-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _EntryNo: selectedEvent.id,
            _BookingStatus: newStatus,
          }),
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to update status");
        }

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

        // Refresh appointments list
        const entry = bookingEntries.find((e) => e.EntryNo.toString() === selectedEvent.id);
        if (entry) {
          const updatedEntries = bookingEntries.map((e) =>
            e.EntryNo.toString() === selectedEvent.id
              ? { ...e, BookingStatus: newStatus }
              : e
          );
          setBookingEntries(updatedEntries);

          const updatedAppointments = appointments.map((a) =>
            a.id === selectedEvent.id
              ? { ...a, status: newStatus as "Finalized" | "Active" | "Cancelled" }
              : a
          );
          setAppointments(updatedAppointments);
        }
      } catch (error: any) {
        showErrorAlert(
          error.message || "Failed to update status",
          "Update Failed"
        );
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [selectedEvent, bookingEntries, appointments]
  );

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
      setSelectedEvent(null);

      // Refresh appointments list
      const updatedEntries = bookingEntries.filter(
        (e) => e.EntryNo.toString() !== selectedEvent.id
      );
      setBookingEntries(updatedEntries);

      const updatedAppointments = appointments.filter((a) => a.id !== selectedEvent.id);
      setAppointments(updatedAppointments);
    } catch (error: any) {
      showErrorAlert(
        error.message || "Failed to delete time off",
        "Delete Failed"
      );
    } finally {
      setIsDeletingTimeOff(false);
    }
  }, [selectedEvent, bookingEntries, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Finalized":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Card className="bg-white dark:bg-slate-900 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                My Appointment/s
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading appointments...
                  </p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No appointments found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment, index) => (
                        <tr
                          key={appointment.id}
                          onClick={() => handleRowClick(appointment.id)}
                          className={`border-b border-gray-200 dark:border-gray-700 ${
                            index % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-gray-50 dark:bg-slate-800"
                          } hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(appointment.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {appointment.time}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {appointment.serviceName || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {appointment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
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
          // Not applicable for customer view
        }}
      />
    </div>
  );
}
