"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import {
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

import { useEffect, useState } from "react";
import { sileo } from "sileo";

/* ================= TYPES ================= */

type SessionUser = {
  booking_setup_code: string;
  name: string;
  name2?: string;
  email: string;
  role: "customer" | "user";
  customer_number?: string;
  phone_number?: string;
  address?: string;
  address2?: string;
  age?: number;
  birthdate?: string;
};

/* ================= UI STYLE ================= */

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "text-xs font-semibold text-gray-500";

/* ================= SIDEBAR ITEMS ================= */

const defaultNavItems = [
  {
    id: "profile",
    label: "Profile",
    description: "Manage personal info",
    icon: <User className="h-4 w-4" />,
  },
  {
    id: "password",
    label: "Password",
    description: "Change your password",
    icon: <LockKeyhole className="h-4 w-4" />,
  },
] as const;

const customerNavItems = [
  {
    id: "customer",
    label: "Customer",
    description: "Update your personal details",
    icon: <User className="h-4 w-4" />,
  },
] as const;

type Section = "profile" | "password" | "customer";

/* ================= PAGE ================= */

export default function AccountPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch("/api/me");
      const data = await res.json();

      const u: SessionUser = data.user;
      setUser(u);

      setName(u.name ?? "");
      setName2(u.name2 ?? "");
      setEmail(u.email ?? "");
      setPhone(u.phone_number ?? "");
      setAddress(u.address ?? "");
      setAddress2(u.address2 ?? "");
      setBirthDate(u.birthdate ?? "");
      setCustomerNumber(u.customer_number ?? "");
      setAge(u.age);

      setLoading(false);
    };

    fetchSession();
  }, []);

  const isCustomer = user?.role === "customer";

  useEffect(() => {
    if (isCustomer) {
      setActiveSection("customer");
    } else if (user?.role === "user" && activeSection === "customer") {
      setActiveSection("profile");
    }
  }, [isCustomer, user?.role, activeSection]);

  /* ================= PASSWORD ================= */

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      sileo.error({ title: "Passwords do not match", fill: "#171717" });
      return;
    }

    setUpdatingPassword(true);
    try {
      await fetch("/api/booking-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode: user?.booking_setup_code,
          emailAddress: email,
          password,
        }),
      });

      setPassword("");
      setConfirmPassword("");

      sileo.success({ title: "Password updated", fill: "#171717" });
    } catch {
      sileo.error({ title: "Failed to update password", fill: "#171717" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const navItems = isCustomer ? customerNavItems : defaultNavItems;
  const active = navItems.find((n) => n.id === activeSection) ?? navItems[0];

  const handleSaveCustomerDetails = async () => {
    if (!customerNumber) {
      sileo.error({ title: "Missing customer number", fill: "#171717" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/customer/update-customer-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerNo: customerNumber,
          name,
          phoneNo: phone,
          email,
          address,
          address2,
          birthDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update details.");
      }

      sileo.success({ title: "Customer details updated", fill: "#171717" });
    } catch (err: any) {
      console.error(err);
      sileo.error({ title: err?.message || "Failed to update details", fill: "#171717" });
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Account</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* LAYOUT (MATCH SETTINGS STYLE) */}
      <div className="h-[calc(100vh-4rem)] bg-gray-100 p-6 overflow-hidden">
        <div className="flex h-full rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* LEFT SIDEBAR */}
          <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-100">
              <h1 className="text-sm font-semibold text-gray-900">Account</h1>
              <p className="text-xs text-gray-400 mt-0.5">Manage your settings</p>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                      isActive
                        ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                    }`}
                  >
                    <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                      {item.icon}
                    </span>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-auto bg-white">
            <div className="px-8 py-7">

              {/* HEADER */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  {active.icon}
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {active.label}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {active.description}
                  </p>
                </div>
              </div>

              {/* CUSTOMER */}
              {activeSection === "customer" && (
                <div className="rounded-lg border border-gray-100 p-5 space-y-4 max-w-2xl">
                  <div className="grid gap-4">
                    <div>
                      <label className={labelClass}>Customer Number</label>
                      <input
                        className={inputClass}
                        value={customerNumber}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        className={inputClass}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Name2</label>
                      <input
                        className={inputClass}
                        value={name2}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        className={inputClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        className={inputClass}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        className={inputClass}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Address 2</label>
                      <input
                        className={inputClass}
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Birthdate</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Age</label>
                      <input
                        className={inputClass}
                        value={age !== undefined ? String(age) : ""}
                        readOnly
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCustomerDetails}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Details"}
                  </button>
                </div>
              )}

              {/* PROFILE */}
              {!isCustomer && activeSection === "profile" && (
                <div className="rounded-lg border border-gray-100 p-5 space-y-4">

                  <div>
                    <label className={labelClass}>Name</label>
                    <input className={inputClass} value={name} readOnly />
                  </div>

                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} value={email} readOnly />
                  </div>
                </div>
              )}

              {/* PASSWORD */}
              {!isCustomer && activeSection === "password" && (
                <div className="rounded-lg border border-gray-100 p-5 space-y-4 max-w-md">

                  <div>
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>
    </>
  );
}