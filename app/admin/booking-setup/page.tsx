"use client";
import { useState, useEffect } from "react";
import { Eye, Trash2, Plus, Edit, Search, Loader2, X } from "lucide-react";
import SideBar from "@/app/components/sidebar/sidebar";
import Link from "next/link";

interface BookingSetup {
  Code: string;
  Description: string;
  Location?: string;
  Link?: string;
}

interface CreateBookingSetupData {
  Code: string;
  Description: string;
  LocationCode: string;
  TimeIncrement: string;
  ClosingAllowableTime: string;
}

export default function BookingSetup() {
  const [bookingSetups, setBookingSetups] = useState<BookingSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateBookingSetupData>({
    Code: "",
    Description: "",
    LocationCode: "",
    TimeIncrement: "30",
    ClosingAllowableTime: "30"
  });

  // Fetch booking setups from API
  useEffect(() => {
    const fetchBookingSetups = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try the API
        const response = await fetch("/api/booking-setup");

        if (!response.ok) {
          // If API fails, use mock data for now
          console.log("API failed, using mock data");
          const mockData: BookingSetup[] = [
            {
              Code: "MAIN",
              Description: "Main Branch",
              Location: "Downtown",
            },
          ];
          setBookingSetups(mockData);
          return;
        }

        const data = await response.json();
        console.log("API response:", data);

        if (data.error) {
          throw new Error(data.message || "Error from API");
        }

        // Transform the data to match our interface
        const setups: BookingSetup[] =
          data.value?.map((item: any) => ({
            Code: item.Code || item.code || "",
            Description: item.Description || item.description || "",
            Location: item.Location || item.location || "",
          })) || [];

        setBookingSetups(setups);
      } catch (err: any) {
        console.error("Error fetching booking setups:", err);
        // Use mock data as fallback
        const mockData: BookingSetup[] = [
          {
            Code: "MAIN",
            Description: "Main Branch",
            Location: "Downtown",
          },
        ];
        setBookingSetups(mockData);
        setError("Using demo data - API connection issue: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingSetups();
  }, []);

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete booking setup ${code}?`)) {
      return;
    }

    try {
      setDeleteLoading(code);
      setError(null);

      const response = await fetch(
        `/api/booking-setup?code=${encodeURIComponent(code)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        // If delete fails, just remove from local state for demo
        console.log("Delete API failed, removing from local state");
        setBookingSetups((prev) => prev.filter((setup) => setup.Code !== code));
        return;
      }

      // Remove from local state
      setBookingSetups((prev) => prev.filter((setup) => setup.Code !== code));
    } catch (err: any) {
      console.error("Error deleting booking setup:", err);
      // Still remove from local state for demo purposes
      setBookingSetups((prev) => prev.filter((setup) => setup.Code !== code));
      setError("Demo mode - Item removed locally: " + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.Code.trim() || !formData.Description.trim()) {
        setError("Code and Description are required fields");
        return;
      }

      // Check if code already exists
      if (bookingSetups.some(setup => setup.Code === formData.Code)) {
        setError("A booking setup with this code already exists");
        return;
      }

      const response = await fetch("/api/booking-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create booking setup");
      }

      // Add the new setup to local state
      const newSetup: BookingSetup = {
        Code: formData.Code,
        Description: formData.Description,
        Location: formData.LocationCode || undefined,
      };

      setBookingSetups(prev => [...prev, newSetup]);
      
      // Reset form and close modal
      setFormData({
        Code: "",
        Description: "",
        LocationCode: "",
        TimeIncrement: "30",
        ClosingAllowableTime: "30"
      });
      setShowCreateModal(false);
      
      // Show success message
      setError("Booking setup created successfully!");
      setTimeout(() => setError(null), 3000);

    } catch (err: any) {
      console.error("Error creating booking setup:", err);
      setError(err.message || "Failed to create booking setup");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBookingSetupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openCreateModal = () => {
    setFormData({
      Code: "",
      Description: "",
      LocationCode: "",
      TimeIncrement: "30",
      ClosingAllowableTime: "30"
    });
    setError(null);
    setShowCreateModal(true);
  };

  const filteredSetups = bookingSetups.filter(
    (setup) =>
      setup.Code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setup.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (setup.Location &&
        setup.Location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading booking setups...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />

      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  Booking Setup
                </h1>
                <p className="text-gray-600">
                  Manage your booking configurations and branch settings
                </p>
              </div>

              <button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add New Setup
              </button>
            </div>
          </div>

          {/* Error/Success Message */}
          {error && (
            <div className={`px-4 py-3 rounded-xl mb-6 ${
              error.includes("successfully") 
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {error.includes("successfully") ? (
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by code, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSetups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "No booking setups found matching your search."
                          : "No booking setups available."}
                      </td>
                    </tr>
                  ) : (
                    filteredSetups.map((setup, index) => (
                      <tr
                        key={setup.Code}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {setup.Code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {setup.Description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {setup.Location || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={{
                                pathname: "/admin/booking-setup-details",
                                query: { code: setup.Code },
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(setup.Code)}
                              disabled={deleteLoading === setup.Code}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deleteLoading === setup.Code ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create New Booking Setup</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.Code}
                  onChange={(e) => handleInputChange("Code", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter unique code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.Description}
                  onChange={(e) => handleInputChange("Description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Code
                </label>
                <input
                  type="text"
                  value={formData.LocationCode}
                  onChange={(e) => handleInputChange("LocationCode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location code (optional)"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading || !formData.Code.trim() || !formData.Description.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Setup"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}