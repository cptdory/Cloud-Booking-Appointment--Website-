// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/signin");
        } else {
          setUsername(data.user.name);
          setUserRole(data.user.role);
          setCustomerNo(data.user.customerNo || "");
        }
      })
      .catch(() => {
        router.replace("/signin");
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  return { userRole, username, customerNo, checkingAuth };
}