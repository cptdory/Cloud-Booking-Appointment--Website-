"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Palette,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface UserData {
  role: string;
  username?: string;
  name: string;
  email: string;
  customerNo?: string;
  staffCode?: string;
  staffName?: string;
  staffColor?: string;
  currentBookingSetup?: {
    code: string;
    parameterId: number;
    parameterValueId: number;
  };
}

export default function AccountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Password tab states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Staff color state (for admin)
  const [staffColor, setStaffColor] = useState("");
  const [changingColor, setChangingColor] = useState(false);

  // Fetch user data and initial staff color
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (!authData.authenticated) {
          router.replace("/signin");
          return;
        }

        setUserData(authData.user);
        setIsAdmin(authData.user?.role === "admin" || authData.user?.role === "global-admin");

        // If admin, fetch the current staff color
        if (authData.user?.role === "admin" && authData.user?.currentBookingSetup) {
          await fetchStaffColor(authData.user.currentBookingSetup);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage({ type: "error", text: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Function to fetch staff color for a single staff member
  const fetchStaffColor = async (bookingSetup: { code: string; parameterId: number; parameterValueId: number }) => {
    try {
      
      const requestBody = {
        _BookingSetupCode: bookingSetup.code,
        _BookingParameterId: bookingSetup.parameterId.toString(),
        _BookingParameterValueId: bookingSetup.parameterValueId.toString(), // ✅ Use parameterValueId, not staffCode
      };

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to fetch staff color:", errorText);
        return;
      }

      const data = await res.json();

      // Parse the response to get the color
      if (data.staffColors && data.staffColors[bookingSetup.parameterValueId]) {
        const newColor = data.staffColors[bookingSetup.parameterValueId].background;
        setStaffColor(newColor);
        setUserData((prev) => prev ? { ...prev, staffColor: newColor } : null);
      } else {
        console.warn("⚠️ No StaffColor found in response for parameter value ID:", bookingSetup.parameterValueId);
        // Set default color if none found
        setStaffColor("#3b82f6");
      }
    } catch (error) {
      console.error("❌ Error fetching staff color:", error);
      setStaffColor("#3b82f6"); // Fallback color
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation required",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      if (isAdmin && userData?.currentBookingSetup) {
        // Admin password change for staff
        const res = await fetch(
          "/api/booking-staff-auth/update-booking-staff-auth-password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _BookingSetupCode: userData.currentBookingSetup.code,
              _BookingParameterId: userData.currentBookingSetup.parameterId.toString(),
              _BookingParameterValueId: userData.currentBookingSetup.parameterValueId.toString(),
              _PortalPassword: newPassword,
            }), 
          }
        );

        if (!res.ok) throw new Error("Password change failed");

        setMessage({ type: "success", text: "Password updated successfully!" });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: "Password change not available" });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to change password. Try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleColorChange = async () => {
    if (!staffColor || !userData?.currentBookingSetup) {
      setMessage({ type: "error", text: "Color is required" });
      return;
    }

    setChangingColor(true);
    setMessage(null);

    try {
      const requestBody = {
        _BookingSetupCode: userData.currentBookingSetup.code,
        _BookingParameterId: userData.currentBookingSetup.parameterId.toString(),
        _BookingParameterValueId: userData.currentBookingSetup.parameterValueId.toString(),
        _StaffColor: staffColor,
      };

      const res = await fetch(
        "/api/booking-staff-auth/update-booking-staff-auth-details",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Staff color update failed:", errorText);
        throw new Error("Color update failed");
      }

      const responseData = await res.json();

      // Refresh the staff color after update
      await fetchStaffColor(userData.currentBookingSetup);

      setMessage({
        type: "success",
        text: "Staff color updated successfully!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("❌ Staff color update error:", error);
      setMessage({
        type: "error",
        text: "Failed to update staff color. Try again.",
      });
    } finally {
      setChangingColor(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Account Settings</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Manage your staff preferences"
              : "Manage your personal information and account preferences"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alert */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Admin View - Only Staff Color and Password */}
      {isAdmin ? (
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="color">Staff Color</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          {/* STAFF COLOR TAB */}
          <TabsContent value="color">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Staff Color Settings
                </CardTitle>
                <CardDescription>
                  Choose a color that represents you in the booking calendar
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Staff Info */}
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Staff Information
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Staff Code:</span>{" "}
                        {userData?.staffCode}
                      </div>
                      <div>
                        <span className="font-medium">Staff Name:</span>{" "}
                        {userData?.staffName}
                      </div>
                      <div>
                        <span className="font-medium">Current Color:</span>
                        <span
                          className="ml-2 px-2 py-1 rounded text-xs border"
                          style={{
                            backgroundColor: staffColor + "20",
                            color: staffColor,
                            borderColor: staffColor,
                          }}
                        >
                          {staffColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="staffColor">Select New Staff Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="staffColor"
                      type="color"
                      value={staffColor}
                      onChange={(e) => setStaffColor(e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <div className="flex-1">
                      <Input
                        value={staffColor}
                        onChange={(e) => setStaffColor(e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter a color code or use the color picker
                  </p>
                </div>

                <Button
                  className="w-full"
                  disabled={changingColor}
                  onClick={handleColorChange}
                >
                  {changingColor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating Color...
                    </>
                  ) : (
                    "Update Staff Color"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PASSWORD TAB */}
          <TabsContent value="password">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your staff portal password
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  className="w-full mt-4"
                  disabled={
                    changingPassword || !newPassword || !confirmPassword
                  }
                  onClick={handlePasswordChange}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Customer View - Show message that profile editing is not available
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <User className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Profile Management</h3>
              <p className="text-muted-foreground max-w-md">
                Customer profile editing is currently not available in the
                portal. Please contact support if you need to update your
                personal information.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
