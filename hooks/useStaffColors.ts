// hooks/useStaffColors.ts
import { useState, useCallback } from "react";

interface StaffColor {
  background: string;
  text: string;
}

interface StaffMapping {
  [staffCode: string]: number;
}

export function useStaffColors() {
  const [staffColors, setStaffColors] = useState<{ [key: string]: StaffColor }>({});
  const [loading, setLoading] = useState(false);

  const loadStaffColors = useCallback(async (
    staffCodes: string[], 
    mappings: StaffMapping, 
    parameterId: string,
    branchCode: string
  ): Promise<{ [key: string]: StaffColor }> => {
    if (staffCodes.length === 0 || !parameterId) return {};

    try {
      setLoading(true);

      const parameterValueIds = staffCodes
        .map(code => mappings[code])
        .filter(id => id !== undefined)
        .map(id => id.toString());

      if (parameterValueIds.length === 0) {
        return {};
      }

      const body = {
        _BookingParameterValueIds: parameterValueIds,
        _BookingSetupCode: branchCode,
        _BookingParameterId: parameterId,
      };

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (res.ok && data.staffColors) {
        const convertedColors: { [key: string]: StaffColor } = {};
        
        Object.keys(data.staffColors).forEach(parameterValueId => {
          const staffCode = Object.keys(mappings).find(
            code => mappings[code].toString() === parameterValueId
          );
          
          if (staffCode) {
            convertedColors[staffCode] = data.staffColors[parameterValueId];
          }
        });
        
        setStaffColors(prev => ({
          ...prev,
          ...convertedColors
        }));
        
        return convertedColors;
      }
      return {};
    } catch (error) {
      console.error("❌ Failed to load staff colors:", error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const getStaffColor = useCallback((staffCode: string): StaffColor => {
    const color = staffColors[staffCode];
    if (color && color.background) {
      return color;
    }
    return {
      background: "#6b7280",
      text: "#ffffff"
    };
  }, [staffColors]);

  return {
    staffColors,
    loading,
    loadStaffColors,
    getStaffColor,
  };
}