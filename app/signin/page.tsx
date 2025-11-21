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

export default function SigninPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [_PortalUsername, set_PortalUsername] = useState("");
  const [_PortalPassword, setPassword] = useState("");
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
          _PortalUsername: _PortalUsername,
          _PortalPassword: _PortalPassword,
          _IsAdminLogin: "false", // required string for BC
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Successful login → JWT cookie already set by backend
      router.push("/booking");
    } catch (err) {
      setError("Something went wrong");
    }

    setIsLoading(false);
  };

  return (
    <>
      <Header />
      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-3 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Sign in to your account
                </h3>
                <p className="text-body-color mb-11 text-center text-base font-medium">
                  Login to your account.
                </p>

                {error && (
                  <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Email / Customer Number */}
                  <div className="mb-8">
                    <Label className="mb-3 block text-sm">
                      Email or Customer Number
                    </Label>
                    <Input
                      type="text"
                      value={_PortalUsername}
                      onChange={(e) => set_PortalUsername(e.target.value)}
                      placeholder="email@example.com / C00101"
                      className="bg-[#f8f8f8] dark:bg-[#2C303B]"
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-8">
                    <Label className="mb-3 block text-sm">Password</Label>

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={_PortalPassword}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your Password"
                        className="bg-[#f8f8f8] dark:bg-[#2C303B] pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mb-6">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </div>
                </form>

                {/* Link */}
                <p className="text-body-color text-center text-base font-medium">
                  Don’t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-blue-600 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
