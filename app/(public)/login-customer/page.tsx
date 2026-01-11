"use client";

import { useState } from "react";
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
import { OTPDialog } from "@/components/otp-dialog";

// LoginForm component for customer login
const CustomerLoginForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user exists first
      const res = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _PortalUsername: email,
          _PortalPassword: '', // dont remove this one leave it blank
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

      // User exists, proceed with OTP verification
      setPendingEmail(email);
      setShowOTPDialog(true);
      setIsLoading(false);
      
    } catch (err) {
      const errorMessage = "Something went wrong";
      showErrorAlert(errorMessage, "Error");
      setIsLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setIsOTPVerified(true);
  };

  const handleProceedWithLogin = async (loginData: any) => {
    try {
      // After OTP verification, log in the user
      const res = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _PortalUsername: pendingEmail,
          _PortalPassword: '',
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
        return;
      }

      showResponseToast("Login successful!", "success");

      setTimeout(() => {
        window.location.href = "/booking";
      }, 1500);
      
    } catch (err) {
      const errorMessage = "Something went wrong during login";
      showErrorAlert(errorMessage, "Error");
    }
  };

  const handleOTPDialogClose = () => {
    setShowOTPDialog(false);
    setIsOTPVerified(false);
    setEmail("");
    setPendingEmail("");
  };

  return (
    <>
      <form className="p-6 md:p-8" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-blue-500">Welcome</h1>
            <p className="text-muted-foreground text-balance">
              Login to your Squadlethics account
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </Field>
          <Field>
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Continue with Email"}
            </Button>
          </Field>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-950 px-2 text-gray-500">
                Or
              </span>
            </div>
          </div>

          <Field>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with Google
            </Button>
          </Field>

          <Field>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
              </svg>
              Login with Facebook
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* OTP Dialog for login verification */}
      <OTPDialog
        isOpen={showOTPDialog}
        onClose={handleOTPDialogClose}
        onOTPVerified={handleOTPVerified}
        onProceedWithBooking={handleProceedWithLogin}
        customerEmail={pendingEmail}
        bookingData={null}
        verificationType="Login Verification"
        successMessage="OTP verified successfully! Logging you in..."
      />
    </>
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
