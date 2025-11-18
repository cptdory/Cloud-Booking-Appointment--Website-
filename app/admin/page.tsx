"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "../components/sidebar/sidebar";

interface BookingEntry {
  EntryNo: number;
  BookingStartDate: string;
  BookingEndDate: string;
  BookingStartTime: string;
  BookingEndTime: string;
  BookingNote: string;
  BookingStatus: string;
  BookingSetupCode: string;
  ServiceType: string;
  StaffCode: string;
  StaffName: string;
  TimeOff: boolean;
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

interface Appointment {
  id: number;
  title: string;
  date: string;
  time: string;
  branch: string;
  service: string;
  staff: string;
  staffCode: string;
  room: string;
  customer: string;
  status: "confirmed" | "pending" | "cancelled";
  color: string;
  rawData?: BookingEntry;
}

// Hardcoded staff colors - you can expand this mapping
const STAFF_COLORS: { [key: string]: string } = {
  "S1": "bg-blue-500",
  "S2": "bg-green-500", 
  "S3": "bg-purple-500",
  "S4": "bg-orange-500",
  "S5": "bg-pink-500",
  "STAFF1": "bg-blue-500",
  "STAFF2": "bg-green-500",
  "STAFF3": "bg-purple-500",
  "JOHN": "bg-blue-500",
  "JANE": "bg-pink-500",
  "MIKE": "bg-green-500",
  "SARAH": "bg-purple-500",
  // Default colors for unknown staff
  "default": "bg-gray-500"
};

export default function AdminDashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin and fetch bookings
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn || userRole !== "admin") {
      router.push("/booking");
      return;
    }

    fetchBookingEntries();
  }, [router]);

  // Get color for staff member
  const getStaffColor = (staffCode: string, staffName: string): string => {
    // Try staff code first
    if (staffCode && STAFF_COLORS[staffCode.toUpperCase()]) {
      return STAFF_COLORS[staffCode.toUpperCase()];
    }
    
    // Try staff name
    if (staffName && STAFF_COLORS[staffName.toUpperCase()]) {
      return STAFF_COLORS[staffName.toUpperCase()];
    }
    
    // Fallback: generate consistent color based on staff code/name
    const staffKey = staffCode || staffName || "default";
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", 
      "bg-pink-500", "bg-red-500", "bg-yellow-500", "bg-indigo-500",
      "bg-teal-500", "bg-cyan-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < staffKey.length; i++) {
      hash = staffKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Fetch booking entries from Business Central API
  const fetchBookingEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month's start and end dates
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Format dates as MM/DD/YYYY for Business Central API
      const formatDateForAPI = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const response = await fetch('/api/booking/get-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _BookingSetupCode: "MAIN",
          _DateFrom: formatDateForAPI(firstDay),
          _DateTo: formatDateForAPI(lastDay)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch booking entries: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to match our Appointment interface
      const transformedAppointments = transformBookingEntries(data);
      setAppointments(transformedAppointments);
      
    } catch (err) {
      console.error('Error fetching booking entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Transform Business Central booking entries to Appointment format
  const transformBookingEntries = (apiResponse: any): Appointment[] => {
    if (!apiResponse.value || typeof apiResponse.value !== 'string') {
      return [];
    }

    try {
      const entries: BookingEntry[] = JSON.parse(apiResponse.value);
      
      return entries.map((entry: BookingEntry) => {
        const staffColor = getStaffColor(entry.StaffCode, entry.StaffName);
        
        return {
          id: entry.EntryNo,
          title: entry.BookingNote || `Appointment #${entry.EntryNo}`,
          date: entry.BookingStartDate,
          time: formatTimeForDisplay(entry.BookingStartTime),
          branch: entry.BookingSetupCode,
          service: entry.ServiceType || 'General Service',
          staff: entry.StaffName || entry.StaffCode,
          staffCode: entry.StaffCode,
          room: entry.Address2 || 'Main Room',
          customer: entry.Name2 || entry.Name || entry.CustomerNo,
          status: getBookingStatus(entry.BookingStatus),
          color: staffColor,
          rawData: entry
        };
      });
    } catch (error) {
      console.error('Error parsing booking entries:', error);
      return [];
    }
  };

  // Format time from "09:00:00" to "9:00 AM"
  const formatTimeForDisplay = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = minutes;
      
      if (hour === 0) {
        return `12:${minute} AM`;
      } else if (hour === 12) {
        return `12:${minute} PM`;
      } else if (hour > 12) {
        return `${hour - 12}:${minute} PM`;
      } else {
        return `${hour}:${minute} AM`;
      }
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString;
    }
  };

  // Map Business Central status to our status types
  const getBookingStatus = (status: string): "confirmed" | "pending" | "cancelled" => {
    switch (status.trim().toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'confirmed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevDate);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateString = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateString);
  };

  const previousMonth = (): void => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    fetchBookingEntriesForMonth(newDate);
  };

  const nextMonth = (): void => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    fetchBookingEntriesForMonth(newDate);
  };

  // Fetch entries for specific month
  const fetchBookingEntriesForMonth = async (date: Date) => {
    try {
      setLoading(true);
      
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const formatDateForAPI = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const response = await fetch('/api/booking/get-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _BookingSetupCode: "MAIN",
          _DateFrom: formatDateForAPI(firstDay),
          _DateTo: formatDateForAPI(lastDay)
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch entries');
      
      const data = await response.json();
      const transformedAppointments = transformBookingEntries(data);
      setAppointments(transformedAppointments);
      
    } catch (err) {
      console.error('Error fetching monthly entries:', err);
      setError('Failed to load bookings for selected month');
    } finally {
      setLoading(false);
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading appointments...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">Manage appointments and schedules</p>
              </div>
              <button
                onClick={fetchBookingEntries}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Refresh Data
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Staff Legend */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Staff Colors</h3>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(appointments.map(apt => apt.staffCode))).map(staffCode => {
                const appointment = appointments.find(apt => apt.staffCode === staffCode);
                if (!appointment) return null;
                
                return (
                  <div key={staffCode} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${appointment.color}`}></div>
                    <span className="text-sm text-gray-700">{appointment.staff}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {formatDate(currentDate)}
              </h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={previousMonth}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setCurrentDate(new Date());
                    fetchBookingEntries();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Week Day Headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-600 py-2 text-xs lg:text-sm"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonthDay = isCurrentMonth(day);
                const isTodayDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`min-h-28 lg:min-h-32 border rounded-lg p-2 ${
                      isTodayDay
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200"
                    } ${
                      isCurrentMonthDay ? "" : "opacity-40"
                    } hover:shadow-md transition cursor-pointer`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isTodayDay ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-xs px-2 py-1 rounded text-white ${apt.color} truncate`}
                          title={`${apt.time} - ${apt.service} (${apt.staff})`}
                        >
                          {apt.time} - {apt.service}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Upcoming Appointments ({appointments.length})
              </h2>
            </div>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments found for this period
                </div>
              ) : (
                appointments
                  .filter((apt) => new Date(apt.date) >= new Date())
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className={`w-3 h-3 rounded ${apt.color}`}></div>
                            <h3 className="font-semibold text-gray-800">
                              {apt.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                apt.status
                              )}`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>📅 {new Date(apt.date).toLocaleDateString()}</div>
                            <div>🕐 {apt.time}</div>
                            <div>👤 {apt.customer}</div>
                            <div>💼 {apt.staff}</div>
                            <div>🏢 {apt.branch}</div>
                            <div>🚪 {apt.room}</div>
                          </div>
                          {apt.rawData?.BookingNote && (
                            <div className="mt-2 text-sm text-gray-500">
                              <strong>Note:</strong> {apt.rawData.BookingNote}
                            </div>
                          )}
                        </div>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition whitespace-nowrap">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}