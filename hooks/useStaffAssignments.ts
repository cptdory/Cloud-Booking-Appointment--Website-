// hooks/useStaffAssignments.ts
import { useState } from "react";
import { StaffAssignment } from "@/types/staffAssignment";

export function useStaffAssignments() {
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaffAssignments = async (branchCode: string, serviceId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/booking-service-staff-rela/get-booking-service-staff-rela",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: branchCode,
            _ServiceId: serviceId,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      let staffData = data.value;
      if (typeof staffData === "string") {
        staffData = JSON.parse(staffData || "[]");
      }

      setStaffAssignments(staffData || []);
      return staffData || [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch staff assignments");
    } finally {
      setLoading(false);
    }
  };

  return { staffAssignments, loading, fetchStaffAssignments };
}