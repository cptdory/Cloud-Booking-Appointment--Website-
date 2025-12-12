"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  showErrorAlert,
  showResponseToast,
} from "@/components/Common/SweetAlert";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// LoginForm component for customer login
const CustomerLoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _PortalUsername: username,
          _PortalPassword: password,
          _IsAdminLogin: "false",
        }),
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Login failed";

        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.error) {
          errorMessage =
            typeof data.error === "string" ? data.error : "Login failed";
        } else if (data.message) {
          errorMessage = data.message;
        }

        showErrorAlert(errorMessage, "Error");
        setIsLoading(false);
        return;
      }

      showResponseToast(data.message || "Login successful!", "success");

      setTimeout(() => {
        window.location.href = "/booking";
      }, 1500);
    } catch (err) {
      const errorMessage = "Something went wrong";
      showErrorAlert(errorMessage, "Error");
      setIsLoading(false);
    }
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-blue-500">Welcome</h1>
          <p className="text-muted-foreground text-balance">
            Login to your Squadlethics account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email or Customer Number</FieldLabel>
          <Input
            id="email"
            type="text"
            placeholder="email@example.com / C00101"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </Field>
        <Field>
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </Field>
        <p className="text-sm text-center">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
};

export default function CustomerLoginPage() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className={cn("flex flex-col gap-6 w-full max-w-4xl")}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <CustomerLoginForm />
              <div className="bg-muted relative hidden md:block">
                <img
                  src="/images/login-img.png"
                  alt="Image"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
