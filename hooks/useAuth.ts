// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [staffCode, setStaffCode] = useState<string | null>(null);
  const [bookingSetup, setBookingSetup] = useState<{
    code: string;
    parameterId: number;
    parameterValueId: number;
  }>({
    code: "",
    parameterId: 0,
    parameterValueId: 0,
  });
  const [customerNo, setCustomerNo] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

useEffect(() => {
  fetch("/api/auth/me", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      if (!data.authenticated) {
        router.replace("/login");
      } else {
        setStaffCode(data.user.staffCode);
        setUsername(data.user.name);
        setUserRole(data.user.role);
        setCustomerNo(data.user.customerNo || "");
        setCustomerEmail(data.user.email || "");

        setBookingSetup({
          code: data.user.currentBookingSetup?.code || "",
          parameterId: data.user.currentBookingSetup?.parameterId || 0,
          parameterValueId: data.user.currentBookingSetup?.parameterValueId || 0,
        });
      }
    })
    .catch(() => {
      router.replace("/login");
    })
    .finally(() => {
      setCheckingAuth(false);
    });
}, [router]);

  const updateCustomerEmail = (newEmail: string) => {
    setCustomerEmail(newEmail);
  };

  return { 
    userRole, 
    username,
    staffCode, 
    customerNo, 
    bookingSetup, 
    customerEmail, 
    checkingAuth, 
    updateCustomerEmail 
  };
}