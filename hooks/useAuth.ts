// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  // const [staffCode, setBookingParameterValueCode] = useState<string | null>(null);
  const [bookingParameterValueId, setBookingParameterValueId] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>(""); // New state for customer email
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/login");
        } else {
          setUsername(data.user.name);
          // setStaffCode(data.user.staffCode);
          setBookingParameterValueId(data.user.bookingParameterValueId);
          setUserRole(data.user.role);
          setCustomerNo(data.user.customerNo || "");
          setCustomerEmail(data.user.email || ""); // Set customer email
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

  return { userRole, username, customerNo, bookingParameterValueId, customerEmail, checkingAuth, updateCustomerEmail };
}