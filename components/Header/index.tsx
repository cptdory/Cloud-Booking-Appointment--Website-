"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { useBookingOrganizationSetup } from "@/hooks/useBookingOrganizationSetup";
import { Skeleton } from "@/components/ui/skeleton";

import type { ReactNode } from "react";
import type { BookingOrganizationSetup } from "@/hooks/useBookingOrganizationSetup";

interface OrgSetupContextType {
  orgSetup: BookingOrganizationSetup | null;
  loading: boolean;
  error: string | null;
}

const OrgSetupContext = createContext<OrgSetupContextType | undefined>(undefined);

interface OrgSetupProviderProps {
  children: ReactNode;
}

export function OrgSetupProvider({ children }: OrgSetupProviderProps) {
  const { orgSetup, loading, error, fetchBookingOrganizationSetup } = useBookingOrganizationSetup();
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
      fetchBookingOrganizationSetup("9903ED01-A73C-4874-8ABF-D2678E3AE23D").catch((err) => {
        console.error("OrgSetupProvider: Failed to fetch org setup", err);
      });
      setFetched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  return (
    <OrgSetupContext.Provider value={{ orgSetup, loading, error }}>
      {children}
    </OrgSetupContext.Provider>
  );
}

export function useOrgSetup() {
  const ctx = useContext(OrgSetupContext);
  if (!ctx) throw new Error("useOrgSetup must be used within OrgSetupProvider");
  return ctx;
}

export default function Header() {
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);
  const { orgSetup, loading } = useOrgSetup();
  
  // useEffect(() => {
  //   console.log("orgSetup:", orgSetup);
  // }, [orgSetup]);
  
  const headline = orgSetup?.Headline || "";
  const customerPortalHeadline = orgSetup?.CustomerPortalHeadline || "";
  const logo = orgSetup?.Logo;

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full z-50 transition-all ${
        sticky
          ? "fixed bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-200 dark:bg-gray-900/90 dark:border-gray-700"
          : "absolute bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {loading ? (
            <Skeleton className="w-[100px] h-[20px]" />
          ) : logo && logo.trim() !== "" ? (
            <>
              <Image
                src={`data:image/png;base64,${logo}`}
                alt="Logo"
                width={100}
                height={20}
                className="dark:hidden"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/logo/bookufy-logo.png";
                }}
              />
              <Image
                src={`data:image/png;base64,${logo}`}
                alt="Logo"
                width={100}
                height={20}
                className="hidden dark:block"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/images/logo/bookufy-logo.png";
                }}
              />
            </>
          ) : (
            <>
              <Image
                src="/images/logo/bookufy-logo.png"
                alt="Logo"
                width={140}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/images/logo/bookufy-logo.png"
                alt="Logo"
                width={140}
                height={40}
                className="hidden dark:block"
              />
            </>
          )}
        </Link>
        {loading ? (
          <Skeleton className="hidden md:block h-5 w-40" />
        ) : (
          <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
            {pathname === "/login" ? headline : pathname === "/login-customer" ? customerPortalHeadline : headline}
          </p>
        )}
      </div>
    </header>
  );
}
