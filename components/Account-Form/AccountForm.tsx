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
import { useToast } from "@/hooks/useToast";
import { useModalAlert } from "@/hooks/useAlert";

import {
  User,
  Loader2,
  Lock,
  Palette,
  Mail,
  Phone,
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

interface CustomerDetails {
  name: string;
  phoneNo: string;
  email: string;
  address: string;
  address2: string;
  age: number;
  birthDate: string;
}

export default function AccountForm() {
  const router = useRouter();
  const toast = useToast();
  const alert = useModalAlert();
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);

  // Password tab states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Staff color state (for admin)
  const [staffColor, setStaffColor] = useState("");
  const [changingColor, setChangingColor] = useState(false);

  // Customer details state
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    address2: "",
    age: 0,
    birthDate: "",
  });
  const [updatingCustomerDetails, setUpdatingCustomerDetails] = useState(false);

  // Message state (no longer used, replaced with toast/alert hooks)
  // const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        const isAdminRole =
          authData.user?.role === "admin" ||
          authData.user?.role === "global-admin";
        const isCustomerRole = authData.user?.role === "customer";

        setIsAdmin(isAdminRole);
        setIsCustomer(isCustomerRole);

        // If admin, fetch the current staff color
        if (isAdminRole && authData.user?.currentBookingSetup) {
          await fetchStaffColor(authData.user.currentBookingSetup);
        }

        // If customer, fetch their details
        if (isCustomerRole && authData.user?.customerNo) {
          await fetchCustomerDetails(authData.user.customerNo);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        alert.showError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Function to fetch staff color for a single staff member
  const fetchStaffColor = async (bookingSetup: {
    code: string;
    parameterId: number;
    parameterValueId: number;
  }) => {
    try {
      const requestBody = {
        _BookingSetupCode: bookingSetup.code,
        _BookingParameterId: bookingSetup.parameterId.toString(),
        _BookingParameterValueId: bookingSetup.parameterValueId.toString(),
      };

      const res = await fetch(
        "/api/booking-staff-auth/get-booking-staff-color",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!res.ok) {
        console.error("❌ Failed to fetch staff color");
        return;
      }

      const data = await res.json();

      if (data.staffColors && data.staffColors[bookingSetup.parameterValueId]) {
        const newColor =
          data.staffColors[bookingSetup.parameterValueId].background;
        setStaffColor(newColor);
        setUserData((prev) =>
          prev ? { ...prev, staffColor: newColor } : null
        );
      } else {
        setStaffColor("#3b82f6");
      }
    } catch (error) {
      console.error("❌ Error fetching staff color:", error);
      setStaffColor("#3b82f6");
    }
  };

  // Fetch customer details
  const fetchCustomerDetails = async (customerNo: string) => {
    try {
      const res = await fetch("/api/customer/get-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerNo }),
      });

      if (!res.ok) {
        console.error("Failed to fetch customer details");
        return;
      }

      const data = await res.json();
      setCustomerDetails({
        name: data.name || "",
        phoneNo: data.phoneNo || "",
        email: data.email || "",
        address: data.address || "",
        address2: data.address2 || "",
        age: data.age || 0,
        birthDate: data.birthDate || "",
      });
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      alert.showError("New password and confirmation required");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert.showError("New passwords do not match");
      return;
    }

    setChangingPassword(true);

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
              _BookingParameterId:
                userData.currentBookingSetup.parameterId.toString(),
              _BookingParameterValueId:
                userData.currentBookingSetup.parameterValueId.toString(),
              _PortalPassword: newPassword,
            }),
          }
        );

        if (!res.ok) throw new Error("Password change failed");

        toast.showSuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else if (isCustomer && userData?.customerNo) {
        // Customer password change
        const res = await fetch("/api/customer/update-customer-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _CustomerNo: userData.customerNo,
            _PortalPassword: newPassword,
          }),
        });

        if (!res.ok) throw new Error("Password change failed");

        toast.showSuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert.showError("Password change not available");
      }
    } catch (error) {
      alert.showError("Failed to change password. Try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleColorChange = async () => {
    if (!staffColor || !userData?.currentBookingSetup) {
      alert.showError("Color is required");
      return;
    }

    setChangingColor(true);

    try {
      const requestBody = {
        _BookingSetupCode: userData.currentBookingSetup.code,
        _BookingParameterId:
          userData.currentBookingSetup.parameterId.toString(),
        _BookingParameterValueId:
          userData.currentBookingSetup.parameterValueId.toString(),
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

      if (!res.ok) throw new Error("Color update failed");

      await fetchStaffColor(userData.currentBookingSetup);

      toast.showSuccess("Staff color updated successfully!");
    } catch (error) {
      console.error("❌ Staff color update error:", error);
      alert.showError("Failed to update staff color. Try again.");
    } finally {
      setChangingColor(false);
    }
  };

  const handleCustomerDetailsChange = async () => {
    if (!userData?.customerNo) {
      alert.showError("Customer number is missing");
      return;
    }

    setUpdatingCustomerDetails(true);

    try {
      const res = await fetch("/api/customer/update-customer-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerNo: userData.customerNo,
          ...customerDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to update details");

      toast.showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating details:", error);
      alert.showError("Failed to update profile. Try again.");
    } finally {
      setUpdatingCustomerDetails(false);
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

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Account Settings</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Manage your staff preferences"
              : isCustomer
              ? "Manage your personal information and account preferences"
              : "Account Settings"}
          </CardDescription>
        </CardHeader>
      </Card>



      {/* Admin View - Staff Color and Password */}
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
      ) : isCustomer ? (
        // Customer View - Profile Details and Password
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          {/* PROFILE DETAILS TAB */}
          <TabsContent value="details">
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Customer No - Read Only */}
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Customer Number</Label>
                  <Input
                    value={userData?.customerNo || ""}
                    disabled
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    This cannot be changed
                  </p>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={customerDetails.birthDate}
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            birthDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={customerDetails.age}
                        disabled
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            age: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            email: e.target.value,
                          })
                        }
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phoneNo"
                        className="flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNo"
                        value={customerDetails.phoneNo}
                        onChange={(e) =>
                          setCustomerDetails({
                            ...customerDetails,
                            phoneNo: e.target.value,
                          })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={customerDetails.address}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          address: e.target.value,
                        })
                      }
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      value={customerDetails.address2}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          address2: e.target.value,
                        })
                      }
                      placeholder="Apt, Suite, etc."
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={updatingCustomerDetails}
                  onClick={handleCustomerDetailsChange}
                >
                  {updatingCustomerDetails ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
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
                <CardDescription>Update your account password</CardDescription>
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
        // Default fallback
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <User className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">Account Settings</h3>
              <p className="text-muted-foreground max-w-md">
                Unable to load your account settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
