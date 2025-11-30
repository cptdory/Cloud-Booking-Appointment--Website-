// hooks/useTimeSlots.ts
import { useState } from "react";

interface AvailableTimeSlot {
  id: number;
  time: string;
  available: boolean;
}

export function useTimeSlots() {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableTimeSlots = async (
    branchCode: string,
    date: string,
    serviceId: string,
    staffId: string,
    dynamicParameters: { id: string; value: string }[]
  ) => {
    if (!branchCode || !serviceId || !staffId || !date) {
      setAvailableTimeSlots([]);
      return;
    }

    setLoading(true);

    try {
      const parameterIds = [
        "1",
        "2",
        ...dynamicParameters.map((p) => p.id),
      ].join("|");
      
      const parameterValues = [
        serviceId,
        staffId,
        ...dynamicParameters.map((p) => p.value),
      ].join("|");

      const response = await fetch(
        "/api/available-timeslot/get-available-timeslot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: branchCode,
            _BookingDate: date,
            _BookingParameterCount: (2 + dynamicParameters.length).toString(),
            _BookingParameterIDs: parameterIds,
            _BookingParameterValueIDs: parameterValues,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch available time slots");
      }

      const data = await response.json();
      const slotsData = data.value || [];
      setAvailableTimeSlots(slotsData);
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch time slots");
    } finally {
      setLoading(false);
    }
  };

  return { availableTimeSlots, loading, fetchAvailableTimeSlots };
}