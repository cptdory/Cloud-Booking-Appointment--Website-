// hooks/useStaffMappings.ts
import { useState, useCallback } from "react";

interface StaffMapping {
  [staffCode: string]: number;
}

export function useStaffMappings() {
  const [staffMappings, setStaffMappings] = useState<StaffMapping>({});
  const [bookingParameterId, setBookingParameterId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const loadStaffMappings = useCallback(async (branchCode: string): Promise<{ mappings: StaffMapping; parameterId: string }> => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/booking-setup/get-booking-setup?code=${branchCode}`
      );
      const json = await res.json();

      if (json.value && json.value.length > 0) {
        const setup = json.value[0];
        
        const staffParam = setup.BookingParameter?.find(
          (p: any) => p.BookingParameterStaff === true
        );

        if (staffParam) {
          const parameterId = staffParam.BookingParameterId.toString();
          setBookingParameterId(parameterId);
          
          const mappings: StaffMapping = {};
          staffParam.BookingParameterValue?.forEach((value: any) => {
            mappings[value.BookingParameterValueCode] = value.BookingParameterValueId;
          });
          
          setStaffMappings(mappings);
          return { mappings, parameterId };
        }
      }
      return { mappings: {}, parameterId: "" };
    } catch (error) {
      console.error("❌ Failed to fetch staff mappings:", error);
      return { mappings: {}, parameterId: "" };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    staffMappings,
    bookingParameterId,
    loading,
    loadStaffMappings,
  };
}