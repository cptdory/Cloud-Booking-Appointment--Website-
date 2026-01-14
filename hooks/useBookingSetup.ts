// hooks/useBookingSetup.ts
import { useState, useCallback } from "react"; // Import useCallback
import { BookingSetup } from "@/types/bookingSetup";

export function useBookingSetup() {
  const [bookingSetup, setBookingSetup] = useState<BookingSetup | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBookingSetup = useCallback(async (branchCode: string) => { // Wrap with useCallback
    setLoading(true);
    try {
      const res = await fetch("/api/booking-setup/get-booking-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: branchCode,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch branch details");
      const data = await res.json();

      let setupData = data.value;
      if (typeof setupData === "string") {
        setupData = JSON.parse(setupData);
      }

      const finalData = Array.isArray(setupData) ? setupData[0] : setupData;
      setBookingSetup(finalData);
      return finalData;
    } catch (error) {
      throw new Error("Failed to fetch booking setup");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on any props or state within the hook
  // The setter functions (setLoading, setBookingSetup) are guaranteed to be stable.

  return { bookingSetup, loading, fetchBookingSetup };
}