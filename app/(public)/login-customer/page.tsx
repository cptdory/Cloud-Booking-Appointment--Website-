"use client";

import { useState, useEffect } from "react";
import { useBookingOrganizationSetup } from "@/hooks/useBookingOrganizationSetup";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useOrgSetup } from "@/components/Header";


// LoginForm component for customer login
interface CustomerLoginFormProps {
  orgLoaded: boolean;
  orgLoading: boolean;
}

const CustomerLoginForm = ({ orgLoaded, orgLoading }: CustomerLoginFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { fetchBookingOrganizationSetup } = useBookingOrganizationSetup();

  // No fetching here, handled in parent

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
                <>Login to your account</>
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
  // Use global org setup context (single call at root level)
  const { orgSetup, loading: orgLoading } = useOrgSetup();
  const loginImage = orgSetup?.CustomerPortalLoginImage || "";
  const orgLoaded = !!orgSetup;

  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className={cn("flex flex-col gap-6 w-full max-w-4xl")}> 
          <Card className="overflow-hidden p-0 mx-auto" style={{ maxWidth: 600, maxHeight: 500, width: '100%', height: '100%' }}>
            <CardContent className="grid p-0 md:grid-cols-2" style={{ minHeight: 400, height: 400 }}>
              <CustomerLoginForm orgLoaded={orgLoaded} orgLoading={orgLoading} />
              <div className="bg-muted relative hidden md:block" style={{ minHeight: 400, height: 400 }}>
                {orgLoading || !orgLoaded ? (
                  <Skeleton className="absolute inset-0 h-full w-full" />
                ) : (
                  <img
                    src={loginImage && loginImage.trim() !== "" ? `data:image/png;base64,${loginImage}` : "/images/login-image.png"}
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
