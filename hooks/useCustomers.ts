// hooks/useCustomers.ts
import { useState, useEffect } from "react";

interface Customer {
  id: string;
  customerNo: string;
  name: string;
  email?: string;
}

export function useCustomers(userRole: string | null) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/get-customers");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      let customersData = data.value || [];
      if (typeof customersData === "string") {
        customersData = JSON.parse(customersData);
      }

      const customerOptions = customersData.map((customer: any) => ({
        id: customer.CustomerNo || customer.No || customer.id,
        customerNo: customer.CustomerNo || customer.No,
        name: customer.Name || customer.DisplayName,
        email: customer.EMail || customer.Email,
      }));

      setCustomers(customerOptions);
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "global-admin" || userRole === "admin") {
      fetchCustomers();
    }
  }, [userRole]);

  return { customers, loading, fetchCustomers };
}