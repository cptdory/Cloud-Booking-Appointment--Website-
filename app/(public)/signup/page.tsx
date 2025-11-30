"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignupPage() {
  const router = useRouter();
  
  // Customer Signup State
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [portalPassword, setPortalPassword] = useState("");

  // Admin Signup State
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [_StaffName, set_StaffName] = useState("");
  const [_PortalPassword, set_PortalPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("customer");

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name,
          PhoneNo: phoneNo,
          EMail: email,
          Address: address,
          Address2: address2,
          Age: age,
          BirthDate: birthDate,
          PortalPassword: portalPassword,
          _IsAdminLogin: "false",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      router.push("/signin");
    } catch (err) {
      setError("Something went wrong");
    }

    setIsLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/booking-staff-auth/create-global-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _StaffName: _StaffName,
          _PortalPassword: _PortalPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      router.push("/signin");
    } catch (err) {
      setError("Something went wrong");
    }

    setIsLoading(false);
  };

  return (
    <>
      <Header />

      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-lg dark:bg-dark mx-auto max-w-[700px] rounded-xl bg-white px-6 py-10 sm:p-[60px] border border-blue-100 dark:border-gray-700">
                {/* Branding Section */}
                <div className="text-center">
                  <div className="inline-block">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Squadlethics
                      </h1>
                    </div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-blue-100 dark:bg-gray-800 p-1 rounded-lg">
                    <TabsTrigger 
                      value="customer"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors text-blue-900 dark:text-gray-200"
                    >
                      Customer Signup
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors text-blue-900 dark:text-gray-200"
                    >
                      Admin Signup
                    </TabsTrigger>
                  </TabsList>

                  {/* Customer Signup Tab */}
                  <TabsContent value="customer" className="space-y-6">
                    <h3 className="mb-3 text-center text-2xl font-bold text-blue-900 sm:text-3xl dark:text-white">
                      Create Customer Account
                    </h3>
                    <p className="text-blue-700 mb-6 text-center text-base font-medium dark:text-gray-300">
                      Sign up as a customer to browse and make appointments.
                    </p>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleCustomerSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                            Full Name
                          </Label>
                          <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Phone Number */}
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                            Phone Number
                          </Label>
                          <Input
                            type="text"
                            value={phoneNo}
                            onChange={(e) => setPhoneNo(e.target.value)}
                            placeholder="09XXXXXXXXX"
                            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Birthdate */}
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                            Birthdate
                          </Label>
                          <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                            Age
                          </Label>
                          <Input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Age"
                            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Email (full width) */}
                      <div className="mt-6">
                        <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      {/* Address (full width textarea) */}
                      <div className="mt-6">
                        <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                          Address
                        </Label>
                        <Textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House No / Street / Barangay"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white min-h-[50px]"
                        />
                      </div>

                      {/* Address 2 (full width textarea) */}
                      <div className="mt-6">
                        <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                          Address 2
                        </Label>
                        <Textarea
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                          placeholder="City / Province / Additional info"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white min-h-[50px]"
                        />
                      </div>

                      {/* Password */}
                      <div className="mt-6">
                        <Label className="mb-2 block text-sm font-medium text-blue-900 dark:text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showCustomerPassword ? "text" : "password"}
                            value={portalPassword}
                            onChange={(e) => setPortalPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
                          >
                            {showCustomerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="mt-8">
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating account..." : "Sign up as Customer"}
                        </Button>
                      </div>
                    </form>

                    <p className="text-blue-700 text-center text-base font-medium mt-4 dark:text-gray-300">
                      Already have an account?{" "}
                      <Link
                        href="/signin"
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline dark:text-blue-400"
                      >
                        Sign in
                      </Link>
                    </p>
                  </TabsContent>

                  {/* Admin Signup Tab */}
                  <TabsContent value="admin" className="space-y-6">
                    <h3 className="mb-3 text-center text-2xl font-bold text-blue-900 sm:text-3xl dark:text-white">
                      Create Admin Account
                    </h3>
                    <p className="text-blue-700 mb-6 text-center text-base font-medium dark:text-gray-300">
                      Sign up as Global Admin to manage the platform.
                    </p>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleAdminSubmit}>
                      {/* Name */}
                      <div className="mb-8">
                        <Label className="mb-3 block text-sm font-medium text-blue-900 dark:text-white">
                          Name
                        </Label>
                        <Input
                          type="text"
                          value={_StaffName}
                          onChange={(e) => set_StaffName(e.target.value)}
                          placeholder="Juan Dela Cruz"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      {/* Password */}
                      <div className="mb-8">
                        <Label className="mb-3 block text-sm font-medium text-blue-900 dark:text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            type={showAdminPassword ? "text" : "password"}
                            value={_PortalPassword}
                            onChange={(e) => set_PortalPassword(e.target.value)}
                            placeholder="Enter your Password"
                            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
                          >
                            {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="mb-6">
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating account..." : "Sign up as Admin"}
                        </Button>
                      </div>
                    </form>

                    <p className="text-blue-700 text-center text-base font-medium dark:text-gray-300">
                      Already have an account?{" "}
                      <Link
                        href="/signin"
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline dark:text-blue-400"
                      >
                        Sign in
                      </Link>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* SVG MASK - Updated with blue theme */}
        <div className="absolute top-0 left-0 z-[-1]">
          <svg
            width="1440"
            height="969"
            viewBox="0 0 1440 969"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <mask
              id="mask0_95:1005"
              style={{ maskType: "alpha" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1440"
              height="969"
            >
              <rect width="1440" height="969" fill="#090E34" />
            </mask>
            <g mask="url(#mask0_95:1005)">
              <path
                opacity="0.1"
                d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
                fill="url(#paint0_linear_95:1005)"
              />
              <path
                opacity="0.1"
                d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
                fill="url(#paint1_linear_95:1005)"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_95:1005"
                x1="1178.4"
                y1="151.853"
                x2="780.959"
                y2="453.581"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_95:1005"
                x1="160.5"
                y1="220"
                x2="1099.45"
                y2="1192.04"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      <Footer />
    </>
  );
}