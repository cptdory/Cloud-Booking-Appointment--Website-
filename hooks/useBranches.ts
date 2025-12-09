// hooks/useBranches.ts
import { useState, useCallback } from "react"; // Import useCallback
import { Branch } from "@/types/branch";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async () => { // Wrap with useCallback
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
  }, []); // Empty dependency array as it doesn't depend on any props or state within the hook
  // The setter functions (setLoading, setBranches) are guaranteed to be stable.

  return { branches, loading, fetchBranches };
}