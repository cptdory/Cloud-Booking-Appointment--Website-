"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation";
import { showErrorAlert, showResponseToast } from "@/components/Common/SweetAlert";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const [staffCode, setStaffCode] = useState("");
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
          _PortalUsername: staffCode,
          _PortalPassword: password,
          _IsAdminLogin: "true",
        }),
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Login failed";
        
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.error) {
          errorMessage = typeof data.error === "string" ? data.error : "Login failed";
        } else if (data.message) {
          errorMessage = data.message;
        }

        showErrorAlert(errorMessage, "Error");
        setIsLoading(false);
        return;
      }

      showResponseToast(data.message || "Login successful!", "success");

      setTimeout(() => {
        window.location.href = "/calendar";
      }, 1500);
    } catch (err) {
      const errorMessage = "Something went wrong";
      showErrorAlert(errorMessage, "Error");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold text-blue-500">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Squadlethics account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
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
                    required placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </Field>
              <Field>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
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
  )
}
