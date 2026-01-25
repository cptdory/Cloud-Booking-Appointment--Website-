// hooks/useBookingEntries.ts
import { useState, useCallback } from "react";
import { BookingEntry } from "@/types/bookingEntry";

export function useBookingEntries() {
  const [bookingEntries, setBookingEntries] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingEntries = useCallback(async (
    branchCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingEntry[]> => {
    try {
      setLoading(true);
      setError(null);

      const formatDate = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const requestBody = {
        _BookingSetupCode: branchCode,
        _DateFrom: formatDate(startDate),
        _DateTo: formatDate(endDate),
        _Status: "Active"
      };

      const response = await fetch("/api/booking-entry/get-booking-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      
      if (!data.value || typeof data.value !== "string") {
        setBookingEntries([]);
        return [];
      }

      const entries: BookingEntry[] = JSON.parse(data.value);
      setBookingEntries(entries);
      return entries;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load bookings";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (entryNo: string, newStatus: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/booking-entry/update-booking-entry-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _EntryNo: entryNo,
          _BookingStatus: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update booking status");
      }

      setBookingEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.EntryNo.toString() === entryNo
            ? { ...entry, BookingStatus: newStatus }
            : entry
        )
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update booking status";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookingEntries,
    loading,
    error,
    fetchBookingEntries,
    updateBookingStatus,
  };
}