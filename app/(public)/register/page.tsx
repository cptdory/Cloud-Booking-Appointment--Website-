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
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
const CustomerSignupForm = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          Age: "",
          BirthDate: birthDate,
          PortalPassword: portalPassword,
          _IsAdminLogin: "false",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Registration failed";

        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.error) {
          errorMessage =
            typeof data.error === "string" ? data.error : "Registration failed";
        } else if (data.message) {
          errorMessage = data.message;
        }

        showErrorAlert(errorMessage);
        setIsLoading(false);
        return;
      }

      showResponseToast(
        data.message || "Account created successfully!",
        "success"
      );
      setTimeout(() => {
        router.push("/login-customer");
      }, 1500);
    } catch (err) {
      const errorMessage = "Something went wrong";
      showErrorAlert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleCustomerSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-blue-500">
            Customer Registration
          </h1>
          <p className="text-muted-foreground text-balance">
            Create an account to book appointments with Squadlethics.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name">
              Full Name <span className="text-red-600">*</span>
            </FieldLabel>
            <Input
              id="name"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="birthDate">Birthdate</FieldLabel>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="phoneNo">Phone Number</FieldLabel>
            <Input
              id="phoneNo"
              type="text"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              placeholder="09XXXXXXXXX"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">
              Email <span className="text-red-600">*</span>
            </FieldLabel>
            <Input
              id="email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House No / Street / Barangay"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="address2">Address 2</FieldLabel>
          <Textarea
            id="address2"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="City / Province / Additional info"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">
            Password <span className="text-red-600">*</span>
          </FieldLabel>
          <div className="relative">
            <Input
              id="password"
              required
              type={showPassword ? "text" : "password"}
              value={portalPassword}
              onChange={(e) => setPortalPassword(e.target.value)}
              placeholder="Enter your password"
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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link
            href="/login-customer"
            className="text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
};

export default function SignupPage() {
  return (
    <>
    <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 pt-24">

        <div className={cn("flex flex-col gap-6 w-full max-w-xl")}>
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              <CustomerSignupForm />
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
