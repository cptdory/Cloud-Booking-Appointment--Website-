"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Separate LoginForm component with its own state
const LoginForm = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _PortalUsername: username,
          _PortalPassword: password,
          _IsAdminLogin: isAdmin ? "true" : "false", 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      router.push(isAdmin ? "/calendar" : "/booking");
    } catch (err) {
      setError("Something went wrong");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Email / Customer Number / Admin Username */}
      <div className="mb-8">
        <Label className="mb-3 block text-sm font-medium text-blue-900 dark:text-white">
          {isAdmin ? "Admin Username" : "Email or Customer Number"}
        </Label>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={isAdmin ? "admin@example.com" : "email@example.com / C00101"}
          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Password */}
      <div className="mb-8">
        <Label className="mb-3 block text-sm font-medium text-blue-900 dark:text-white">Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400 dark:bg-[#2C303B] dark:border-gray-600 dark:text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
          {isLoading ? "Signing in..." : `Sign in as ${isAdmin ? "Admin" : "Customer"}`}
        </Button>
      </div>
    </form>
  );
};

export default function SigninPage() {
  const [activeTab, setActiveTab] = useState("customer");

  return (
    <>
      <Header />
      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-lg dark:bg-dark mx-auto max-w-[500px] rounded-xl bg-white px-6 py-10 sm:p-[60px] border border-blue-100 dark:border-gray-700">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-blue-100 dark:bg-gray-800 p-1 rounded-lg">
                    <TabsTrigger 
                      value="customer"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors text-blue-900 dark:text-gray-200"
                    >
                      Customer Login
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-colors text-blue-900 dark:text-gray-200"
                    >
                      Admin Login
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="customer" className="space-y-6">
                    <h3 className="mb-3 text-center text-2xl font-bold text-blue-900 sm:text-3xl dark:text-white">
                      Sign in to your account
                    </h3>
                    <p className="text-blue-700 mb-6 text-center text-base font-medium dark:text-gray-300">
                      Login to your customer account.
                    </p>
                    
                    <LoginForm isAdmin={false} />
                    
                    <p className="text-blue-700 text-center text-base font-medium dark:text-gray-300">
                      Don't have an account?{" "}
                      <Link
                        href="/signup"
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline dark:text-blue-400"
                      >
                        Sign up
                      </Link>
                    </p>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-6">
                    <h3 className="mb-3 text-center text-2xl font-bold text-blue-900 sm:text-3xl dark:text-white">
                      Admin Sign In
                    </h3>
                    <p className="text-blue-700 mb-6 text-center text-base font-medium dark:text-gray-300">
                      Login to your admin account.
                    </p>
                    
                    <LoginForm isAdmin={true} />
                    
                    <p className="text-blue-700 text-center text-base font-medium dark:text-gray-300">
                      Need customer access?{" "}
                      <button
                        onClick={() => setActiveTab("customer")}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline dark:text-blue-400"
                      >
                        Switch to customer login
                      </button>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        
        {/* SVG Mask - Updated with blue theme */}
        <div className="absolute bottom-0 left-0 z-[-1]">
          <svg
            width="239"
            height="601"
            viewBox="0 0 239 601"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              opacity="0.3"
              x="-184.451"
              y="600.973"
              width="196"
              height="541.607"
              rx="2"
              transform="rotate(-128.7 -184.451 600.973)"
              fill="url(#paint0_linear_93:235)"
            />
            <rect
              opacity="0.3"
              x="-188.201"
              y="385.272"
              width="59.7544"
              height="541.607"
              rx="2"
              transform="rotate(-128.7 -188.201 385.272)"
              fill="url(#paint1_linear_93:235)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_93:235"
                x1="-90.1184"
                y1="420.414"
                x2="-90.1184"
                y2="1131.65"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_93:235"
                x1="-159.441"
                y1="204.714"
                x2="-159.441"
                y2="915.952"
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