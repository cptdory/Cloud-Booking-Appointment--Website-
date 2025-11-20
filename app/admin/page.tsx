"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
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

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    description?: string;
    location?: string;
    staff: string;
    staffCode: string;
    service: string;
    customer: string;
    status: string;
    branch: string;
    room: string;
    rawData?: BookingEntry;
  };
  color: string;
  textColor: string;
}

// Hardcoded staff colors with good text contrast
const STAFF_COLORS: { [key: string]: { background: string; text: string } } = {
  "S1": { background: "#3788d8", text: "#ffffff" },
  "S2": { background: "#10b981", text: "#ffffff" },
  "S3": { background: "#8b5cf6", text: "#ffffff" },
  "S4": { background: "#f59e0b", text: "#000000" },
  "default": { background: "#6b7280", text: "#ffffff" }
};

export default function AdminDashboard() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user is admin and fetch bookings
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn");


    fetchBookingEntries();
  }, [router]);

  // Get color for staff member with good contrast
  const getStaffColor = (staffCode: string, staffName: string): { background: string; text: string } => {
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
    const colorOptions = [
      { background: "#3788d8", text: "#ffffff" },
      { background: "#10b981", text: "#ffffff" },
      { background: "#8b5cf6", text: "#ffffff" },
      { background: "#f59e0b", text: "#000000" },
      { background: "#ef4444", text: "#ffffff" },
      { background: "#06b6d4", text: "#000000" },
      { background: "#84cc16", text: "#000000" },
      { background: "#f97316", text: "#000000" },
      { background: "#ec4899", text: "#ffffff" },
      { background: "#14b8a6", text: "#000000" }
    ];
    
    let hash = 0;
    for (let i = 0; i < staffKey.length; i++) {
      hash = staffKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colorOptions.length;
    return colorOptions[colorIndex];
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
      
      // Transform the API response to FullCalendar events
      const transformedEvents = transformBookingEntriesToEvents(data);
      setEvents(transformedEvents);
      
    } catch (err) {
      console.error('Error fetching booking entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Transform Business Central booking entries to FullCalendar events
  const transformBookingEntriesToEvents = (apiResponse: any): CalendarEvent[] => {
    if (!apiResponse.value || typeof apiResponse.value !== 'string') {
      return [];
    }

    try {
      const entries: BookingEntry[] = JSON.parse(apiResponse.value);
      
      return entries.map((entry: BookingEntry) => {
        const staffColor = getStaffColor(entry.StaffCode, entry.StaffName);
        
        // Combine date and time for FullCalendar
        const startDateTime = `${entry.BookingStartDate}T${entry.BookingStartTime}`;
        const endDateTime = entry.BookingEndDate && entry.BookingEndTime 
          ? `${entry.BookingEndDate}T${entry.BookingEndTime}`
          : `${entry.BookingStartDate}T${entry.BookingStartTime}`;

        return {
          id: entry.EntryNo.toString(),
          title: entry.BookingNote || `Appointment #${entry.EntryNo}`,
          start: startDateTime,
          end: endDateTime,
          color: staffColor.background,
          textColor: staffColor.text,
          extendedProps: {
            description: entry.BookingNote,
            location: entry.Address2 || '-',
            staff: entry.StaffName || entry.StaffCode,
            staffCode: entry.StaffCode,
            service: entry.ServiceType || '-',
            customer: entry.Name2 || entry.Name || entry.CustomerNo,
            status: entry.BookingStatus,
            branch: entry.BookingSetupCode,
            room: entry.Address2 || 'Main Room',
            rawData: entry
          }
        };
      });
    } catch (error) {
      console.error('Error parsing booking entries:', error);
      return [];
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                Appointment Calendar
              </h1>
              <p className="text-gray-600">View all scheduled appointments</p>
            </div>
            <button
              onClick={fetchBookingEntries}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-lg hover:shadow-xl"
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
          <div className="flex flex-wrap gap-4">
            {Object.entries(STAFF_COLORS).map(([staffCode, colors]) => (
              <div key={staffCode} className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded" 
                  style={{ backgroundColor: colors.background }}
                ></div>
                <span className="text-sm text-gray-700">{staffCode}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            height="auto"
            navLinks={true}
            editable={false}
            selectable={false}
            dayMaxEvents={3}
            weekends={true}
            nowIndicator={true}
            displayEventTime={true}
            displayEventEnd={true}
            views={{
              dayGridMonth: {
                dayMaxEvents: 3
              },
              timeGrid: {
                slotMinTime: '06:00:00',
                slotMaxTime: '22:00:00',
                allDaySlot: true
              }
            }}
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              list: 'List'
            }}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date:
                  </label>
                  <p className="text-gray-600">
                    {new Date(selectedEvent.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time:
                  </label>
                  <p className="text-gray-600">
                    {new Date(selectedEvent.start).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(selectedEvent.end).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Staff */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Staff:
                  </label>
                  <p className="text-gray-600">{selectedEvent.extendedProps.staff}</p>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Service:
                  </label>
                  <p className="text-gray-600">{selectedEvent.extendedProps.service}</p>
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Customer:
                  </label>
                  <p className="text-gray-600">{selectedEvent.extendedProps.customer}</p>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Branch:
                  </label>
                  <p className="text-gray-600">{selectedEvent.extendedProps.branch}</p>
                </div>

                {/* Room/Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Location:
                  </label>
                  <p className="text-gray-600">{selectedEvent.extendedProps.location}</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status:
                  </label>
                  <p className="text-gray-600 capitalize">{selectedEvent.extendedProps.status}</p>
                </div>

                {/* Description */}
                {selectedEvent.extendedProps.description && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Description:
                    </label>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}