"use client";

import { useEffect, useState } from "react";

export function useBookingParams(code: string, parameterId: string) {
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parameterName, setParameterName] = useState("");
  const [parameterData, setParameterData] = useState<any>(null);

  // Flags
  const [isParamStaff, setIsParamStaff] = useState("false");
  const [isParamService, setIsParamService] = useState("false");
  const [checkDuration, setCheckDuration] = useState("false");

  const loadValues = async () => {
    if (!code || !parameterId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/booking-setup/get-booking-setup?code=${code}`
      );
      const json = await res.json();

      const setup = json.value?.[0];
      const param = setup?.BookingParameter?.find(
        (p: any) => p.BookingParameterId.toString() === parameterId
      );

      if (!param) throw new Error("Parameter not found");

      setIsParamStaff(String(param.BookingParameterStaff ?? "false"));
      setIsParamService(String(param.BookingParameterService ?? "false"));
      setCheckDuration(String(param.BookingParameterCheckDuration ?? "false"));

      setParameterName(param.BookingParameterCode);
      setParameterData(param);

      setValues(param.BookingParameterValue || []);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValues();
  }, [code, parameterId]);

  return {
    values,
    loading,
    error,
    parameterName,
    parameterData,
    isParamStaff,
    isParamService,
    checkDuration,

    loadValues,
  };
}
