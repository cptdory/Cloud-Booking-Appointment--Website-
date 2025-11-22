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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface UserProfile {
  name: string;
  phoneNo: string;
  email: string;
  address: string;
  address2: string;
  age: number;
  birthDate: string;
  customerNo?: string;
}

export default function AccountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    address2: "",
    age: 0,
    birthDate: "",
    customerNo: "",
  });

  const [originalData, setOriginalData] = useState<UserProfile>({
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    address2: "",
    age: 0,
    birthDate: "",
    customerNo: "",
  });

  // Password tab states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (!authData.authenticated) {
          router.replace("/signin");
          return;
        }

        const profileRes = await fetch("/api/customer/get-customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerNo: authData.user.customerNo,
          }),
        });

        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileRes.json();

        const userData: UserProfile = {
          name: profileData.name || "",
          phoneNo: profileData.phoneNo || "",
          email: profileData.email || "",
          address: profileData.address || "",
          address2: profileData.address2 || "",
          age: profileData.age || 0,
          birthDate: profileData.birthDate || "",
          customerNo: profileData.customerNo || authData.user.customerNo,
        };

        setFormData(userData);
        setOriginalData(userData);
      } catch (error) {
        console.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: "error", text: "Invalid email format" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/customer/update-customer-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Profile update failed");

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setOriginalData(formData);

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update profile. Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setMessage(null);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

const handlePasswordChange = async () => {
  if (!newPassword || !confirmPassword) {
    setMessage({ type: "error", text: "New password and confirmation required" });
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage({ type: "error", text: "New passwords do not match" });
    return;
  }

  setChangingPassword(true);
  setMessage(null);

  try {
    // Get customer number
    const authRes = await fetch("/api/auth/me", { cache: "no-store" });
    const authData = await authRes.json();

    if (!authData.authenticated) {
      router.replace("/signin");
      return;
    }

    const customerNo = authData.user.customerNo;

    // Send request to your Next.js API route
    const res = await fetch("/api/customer/update-customer-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _CustomerNo: customerNo,          // ✅ REQUIRED BY BC
        _PortalPassword: newPassword,     // ✅ REQUIRED BY BC
      }),
    });

    if (!res.ok) throw new Error("Password change failed");

    setMessage({ type: "success", text: "Password updated successfully!" });
    setNewPassword("");
    setConfirmPassword("");
  } catch (error) {
    setMessage({
      type: "error",
      text: "Failed to change password. Try again.",
    });
  } finally {
    setChangingPassword(false);
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
            Manage your personal information and account preferences
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

      {/* TABS */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <form onSubmit={handleSubmit}>
            {/* Personal Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {formData.customerNo && (
                  <div className="space-y-2">
                    <Label>Customer Number</Label>
                    <Input
                      readOnly
                      value={formData.customerNo}
                      className="bg-muted font-semibold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phoneNo}
                    onChange={(e) =>
                      handleInputChange("phoneNo", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        handleInputChange("age", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Birth Date</Label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        handleInputChange("birthDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Address Line 1</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={formData.address2}
                    onChange={(e) =>
                      handleInputChange("address2", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={saving || !hasChanges}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>Save Changes</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving || !hasChanges}
                  >
                    Cancel
                  </Button>
                </div>

                {!hasChanges && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    No changes to save
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* PASSWORD TAB */}
        <TabsContent value="password">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full mt-4"
                disabled={changingPassword}
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
    </div>
  );
}
