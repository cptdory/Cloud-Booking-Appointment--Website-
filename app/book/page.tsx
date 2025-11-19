"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  branch: string;
  service: string;
  staff: string;
  room: string;
  date: string;
  selectedTime: string;
  customerNo: string;
  bookingNote: string;
}

interface SelectOption {
  id: string;
  name: string;
}

interface AvailableTimeSlot {
  time: string;
  available: boolean;
}

export default function BookingPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [staff, setStaff] = useState<SelectOption[]>([]);
  const [rooms, setRooms] = useState<SelectOption[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    AvailableTimeSlot[]
  >([]);
  const [loading, setLoading] = useState({
    branches: false,
    branchDetails: false,
    timeSlots: false,
    submitting: false,
  });

  const [formData, setFormData] = useState<FormData>({
    branch: "",
    service: "",
    staff: "",
    room: "",
    date: "",
    selectedTime: "",
    customerNo: "",
    bookingNote: "",
  });

  // Authentication check
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }) // <– IMPORTANT: disable caching
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/"); // <– replace, not push
        } else {
          setUsername(data.user.name);
          setUserRole(data.user.role);
          setCustomerNo(data.user.customerNo);
        }
      })
      .catch(() => {
        router.replace("/");
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);
const handleLogout = async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
  });

  // Hard refresh to clear all cached React pages
  window.location.href = "/";
};

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading((prev) => ({ ...prev, branches: true }));
      try {
        const res = await fetch("/api/booking/setup-list");
        if (!res.ok) throw new Error("Failed to fetch branches");
        const json = await res.json();

        const options = (json.value || []).map((b: any) => ({
          id: b.Code,
          name: b.Description || b.Code,
        }));

        setBranches(options);
      } catch (error) {
        console.error("Error fetching branches:", error);
        alert("Failed to load branches");
      } finally {
        setLoading((prev) => ({ ...prev, branches: false }));
      }
    };

    fetchBranches();
  }, []);

  // Fetch branch details when branch is selected
  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!formData.branch) {
        setServices([]);
        setStaff([]);
        setRooms([]);
        return;
      }

      setLoading((prev) => ({ ...prev, branchDetails: true }));

      try {
        const res = await fetch(
          `/api/booking/branch-details?code=${formData.branch}`
        );
        if (!res.ok) throw new Error("Failed to fetch branch details");

        const data = await res.json();

        // Use the data from the API
        setServices(data.services || []);
        setStaff(data.staff || []);
        setRooms(data.rooms || []);

        // Reset dependent fields
        setFormData((prev) => ({
          ...prev,
          service: "",
          staff: "",
          room: "",
          selectedTime: "",
        }));
        setAvailableTimeSlots([]);
      } catch (error) {
        console.error("Error fetching branch details:", error);
        // Fallback to empty arrays
        setServices([]);
        setStaff([]);
        setRooms([]);
      } finally {
        setLoading((prev) => ({ ...prev, branchDetails: false }));
      }
    };

    fetchBranchDetails();
  }, [formData.branch]);

  // Fetch available time slots when all required fields are selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (
        !formData.branch ||
        !formData.service ||
        !formData.staff ||
        !formData.room ||
        !formData.date
      ) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoading((prev) => ({ ...prev, timeSlots: true }));

      try {
        const response = await fetch("/api/booking/available-slots", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: formData.branch,
            _BookingDate: formData.date,
            _BookingParameterCount: 3,
            _BookingParameterIDs: "4|5|6",
            _BookingParameterValueIDs: `${formData.service}|${formData.staff}|${formData.room}`,
          }),
        });

        if (!response.ok)
          throw new Error("Failed to fetch available time slots");

        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const slots = data.value.map((slot: any) => ({
            time: slot.time, // Use 'time' instead of 'TimeSlot'
            available: slot.available, // Use 'available' instead of 'Available'
          }));
          setAvailableTimeSlots(slots);
        } else {
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setAvailableTimeSlots([]);
      } finally {
        setLoading((prev) => ({ ...prev, timeSlots: false }));
      }
    };

    fetchAvailableTimeSlots();
  }, [
    formData.branch,
    formData.service,
    formData.staff,
    formData.room,
    formData.date,
  ]);

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeSlotClick = (time: string): void => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();

    if (
      !formData.branch ||
      !formData.service ||
      !formData.staff ||
      !formData.room ||
      !formData.date ||
      !formData.selectedTime
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));

    try {
      const response = await fetch("/api/booking/book-slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: formData.branch,
          _BookingDate: formData.date,
          _BookingStartTime: formData.selectedTime,
          _BookingParameterCount: 3,
          _BookingParameterIDs: "4|5|6",
          _BookingParameterValueIDs: `${formData.service}|${formData.staff}|${formData.room}`,
          _CustomerNo: formData.customerNo,
          _BookingNote: formData.bookingNote || "Booking from web app",
        }),
      });

      if (!response.ok) throw new Error("Failed to create booking");

      const result = await response.json();

      console.log("Booking created:", result);
      alert("Booking confirmed successfully!");

      // Reset form
      setFormData({
        branch: "",
        service: "",
        staff: "",
        room: "",
        date: "",
        selectedTime: "",
        customerNo: "C00080",
        bookingNote: "",
      });
      setAvailableTimeSlots([]);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleAdminPanel = (): void => {
    router.push("/admin");
  };

  useEffect(() => {
    if (customerNo) {
      setFormData((prev) => ({
        ...prev,
        customerNo: customerNo,
      }));
    }
  }, [customerNo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Book an Appointment
              </h1>
              <p className="text-gray-600">
                {username
                  ? `Welcome, ${username}!`
                  : "Fill in the details below to schedule your visit"}
              </p>
            </div>
            <div className="flex gap-2">
              {userRole === "admin" && (
                <button
                  onClick={handleAdminPanel}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition shadow-md"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-md"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6 mt-8">
            {/* Branch */}
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Branch Location
              </label>
              {loading.branches ? (
                <p className="text-gray-500">Loading branches...</p>
              ) : (
                <select
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  required
                >
                  <option value="" disabled>
                    Choose a branch...
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Service */}
            <div>
              <label
                htmlFor="service"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Service
              </label>
              {loading.branchDetails ? (
                <p className="text-gray-500">Loading services...</p>
              ) : (
                <select
                  id="service"
                  value={formData.service}
                  onChange={(e) => handleInputChange("service", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  required
                  disabled={!formData.branch}
                >
                  <option value="" disabled>
                    Choose a service...
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Staff */}
            <div>
              <label
                htmlFor="staff"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Staff
              </label>
              {loading.branchDetails ? (
                <p className="text-gray-500">Loading staff...</p>
              ) : (
                <select
                  id="staff"
                  value={formData.staff}
                  onChange={(e) => handleInputChange("staff", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  required
                  disabled={!formData.branch}
                >
                  <option value="" disabled>
                    Choose a staff member...
                  </option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Room */}
            <div>
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Room
              </label>
              {loading.branchDetails ? (
                <p className="text-gray-500">Loading rooms...</p>
              ) : (
                <select
                  id="room"
                  value={formData.room}
                  onChange={(e) => handleInputChange("room", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                  required
                  disabled={!formData.branch}
                >
                  <option value="" disabled>
                    Choose a room...
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 text-gray-900 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Customer Number */}
            <div>
              <label
                htmlFor="customerNo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Customer Number
              </label>
              <input
                type="text"
                id="customerNo"
                value={formData.customerNo}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Booking Note */}
            <div>
              <label
                htmlFor="bookingNote"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Booking Note (Optional)
              </label>
              <textarea
                id="bookingNote"
                value={formData.bookingNote}
                onChange={(e) =>
                  handleInputChange("bookingNote", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Time
              </label>
              {loading.timeSlots ? (
                <p className="text-gray-500">Loading available time slots...</p>
              ) : (
                <>
                  {/* Debug info - remove this after debugging */}
                  <div className="text-xs text-gray-500 mb-2">
                    Total slots: {availableTimeSlots.length}, Available:{" "}
                    {availableTimeSlots.filter((slot) => slot.available).length}
                    , Booked:{" "}
                    {
                      availableTimeSlots.filter((slot) => !slot.available)
                        .length
                    }
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableTimeSlots.map((slot, index) => (
                      <button
                        key={`${slot.time}-${index}`}
                        type="button"
                        onClick={() => handleTimeSlotClick(slot.time)}
                        disabled={!slot.available}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          formData.selectedTime === slot.time
                            ? "bg-blue-600 text-white shadow-md"
                            : slot.available
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {slot.time}
                        {!slot.available && " (Booked)"}
                      </button>
                    ))}
                  </div>
                  {!formData.selectedTime && availableTimeSlots.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Please select a time slot
                    </p>
                  )}
                  {availableTimeSlots.length === 0 && formData.date && (
                    <p className="text-sm text-red-500 mt-2">
                      No available time slots for selected date
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading.submitting || !formData.selectedTime}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition shadow-lg hover:shadow-xl ${
                loading.submitting || !formData.selectedTime
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading.submitting ? "Creating Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
