// hooks/useBranches.ts
import { useState } from "react";
import { Branch } from "@/types/branch";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/booking-setup/get-booking-setup-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const branchesData = data.value || [];
      setBranches(branchesData);
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  return { branches, loading, fetchBranches };
}