import { useState, useCallback } from "react";

export interface BookingOrganizationSetup {
  EnablePublicBooking: boolean;
  [key: string]: any;
}

export function useBookingOrganizationSetup() {
  const [orgSetup, setOrgSetup] = useState<BookingOrganizationSetup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingOrganizationSetup = useCallback(async (tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/booking-organization-setup/get-booking-organization-setup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _TenantId: tenantId,
          }),
        }
      );

      if (!res.ok) {
        const errorMessage = `Failed to fetch organization setup: ${res.status} ${res.statusText}`;
        setError(errorMessage);
        console.error(errorMessage);
        return null;
      }
      const data = await res.json();

      const finalData = data.data;
      setOrgSetup(finalData);
      return finalData;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch organization setup";
      setError(errorMessage);
      console.error("Error fetching organization setup:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { orgSetup, loading, error, fetchBookingOrganizationSetup };
}
