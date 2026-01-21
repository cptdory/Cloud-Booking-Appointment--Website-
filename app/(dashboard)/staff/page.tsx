"use client";

import React, { useEffect, useState } from "react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Key, Palette, Mail } from "lucide-react";

import { useBookingParams } from "@/hooks/useBookingParams";
import { useParameterCRUD } from "@/hooks/useParameterCRUD";
import { useAuth } from "@/hooks/useAuth";

export default function StaffPage() {
  // read url params
  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const _BookingSetupCode = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

  // -------------------------
  // Use booking params hook
  // -------------------------
  const {
    values,
    loading,
    error: bookingError,
    parameterName,
    isParamStaff,
    isParamService,
    checkDuration,
    loadValues,
  } = useBookingParams(_BookingSetupCode, parameterId);

  // Convert to booleans if needed elsewhere:
  const isStaffFlag = isParamStaff === "true";
  const isServiceFlag = isParamService === "true";

  // -------------------------
  // Use parameter CRUD hook
  // -------------------------
  const getItemType = () => {
    if (isParamService === "true") return "service";
    if (isParamStaff === "true") return "staff";
    return "item";
  };

  const crud = useParameterCRUD({
    code: _BookingSetupCode,
    parameterId,
    isParamStaff,
    isParamService,
    loadValues,
    getItemType,
  });


  const [staffColors, setStaffColors] = useState<Record<string, { background: string; text: string }>>({});
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorStaff, setColorStaff] = useState<any | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [updatingColor, setUpdatingColor] = useState(false);

  const colorOptions = [
    { value: "#3b82f6", label: "Blue", color: "bg-blue-500" },
    { value: "#ef4444", label: "Red", color: "bg-red-500" },
    { value: "#10b981", label: "Green", color: "bg-green-500" },
    { value: "#f59e0b", label: "Yellow", color: "bg-yellow-500" },
    { value: "#8b5cf6", label: "Purple", color: "bg-purple-500" },
    { value: "#ec4899", label: "Pink", color: "bg-pink-500" },
    { value: "#f97316", label: "Orange", color: "bg-orange-500" },
    { value: "#14b8a6", label: "Teal", color: "bg-teal-500" },
    { value: "#6366f1", label: "Indigo", color: "bg-indigo-500" },
    { value: "#6b7280", label: "Gray", color: "bg-gray-500" },
  ];

  // Load staff colors for the list when values change
  useEffect(() => {
    if (values && values.length > 0) {
      loadStaffColors(values);
    } else {
      setStaffColors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const loadStaffColors = async (staffList: any[]) => {
    try {
      const valueIds = staffList.map((s) => String(s.BookingParameterValueId));

      const body = {
        _BookingParameterValueIds: valueIds,
        _BookingSetupCode,
        _BookingParameterId: parameterId,
      };

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json.staffColors) {
        setStaffColors(json.staffColors);
      } else {
        // silently ignore — keep defaults
        console.error("Color API error:", json?.error || json);
      }
    } catch (err) {
      console.error("Failed to load staff colors:", err);
    }
  };

  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  const getColorBadge = (valueId: string) => {
    const color = staffColors[valueId];
    if (!color) {
      return (
        <Badge variant="secondary" className="bg-gray-500 text-white">
          Gray
        </Badge>
      );
    }
    const colorName = colorOptions.find((opt) => opt.value === color.background)?.label || "Custom";
    return (
      <Badge
        className="text-xs font-medium"
        style={{
          backgroundColor: color.background,
          color: color.text,
        }}
      >
        {colorName}
      </Badge>
    );
  };

  const openColorDialog = (staff: any) => {
    setColorStaff(staff);
    setColorDialogOpen(true);

    const valueId = String(staff.BookingParameterValueId);
    const current = staffColors[valueId];

    if (current) {
      setCurrentColor(current.background);
      setSelectedColor(current.background);
    } else {
      setCurrentColor("#6b7280");
      setSelectedColor("#6b7280");
    }
  };

  const handleUpdateColor = async () => {
    if (!colorStaff || !selectedColor) return;
    setUpdatingColor(true);
    try {
      const body = {
        _BookingSetupCode,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(colorStaff.BookingParameterValueId),
        _StaffColor: selectedColor,
      };

      const res = await fetch("/api/booking-staff-auth/update-booking-staff-auth-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update color");

      // update local colors map
      setStaffColors((prev) => ({
        ...prev,
        [String(colorStaff.BookingParameterValueId)]: {
          background: selectedColor,
          text: getContrastColor(selectedColor),
        },
      }));

      setColorDialogOpen(false);
      setColorStaff(null);
      setSelectedColor("");
      setCurrentColor("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingColor(false);
      // refresh list
      await loadValues();
    }
  };

  // -------------------------
  // Password update state + logic
  // -------------------------
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordStaff, setPasswordStaff] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // -------------------------
  // Email update state + logic
  // -------------------------
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailStaff, setEmailStaff] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const openEmailDialog = async (staff: any) => {
    setEmailStaff(staff);
    setEmailDialogOpen(true);
    setEmail("");
    setLoadingEmail(true);
    
    try {
      const body = {
        _BookingSetupCode,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(staff.BookingParameterValueId),
      };

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json.email) {
        setEmail(json.email);
      } else {
        console.error("Failed to fetch email:", json?.error);
        setEmail("");
      }
    } catch (err) {
      console.error("Error fetching email:", err);
      setEmail("");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordStaff || !newPassword) return;

    if (newPassword !== confirmPassword) {
      // no setter exposed in CRUD hook; display as bookingError by console and return
      console.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const body = {
        _BookingSetupCode,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(passwordStaff.BookingParameterValueId),
        _Password: newPassword,
      };

      const res = await fetch("/api/booking-user/update-booking-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update password");

      setPasswordDialogOpen(false);
      setPasswordStaff(null);
      setNewPassword("");
      setConfirmPassword("");
      // refresh data
      await loadValues();
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailStaff || !email) return;

    setUpdatingEmail(true);
    try {
      const body = {
        _BookingSetupCode,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(emailStaff.BookingParameterValueId),
        _StaffEmail: email,
      };

      const res = await fetch("/api/booking-staff-auth/update-booking-staff-auth-email-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update email");

      setEmailDialogOpen(false);
      setEmailStaff(null);
      setEmail("");
      // refresh data
      await loadValues();
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingEmail(false);
    }
  };


  // Add auth hook and determine permission
  const { userRole } = useAuth();
  const canEdit = userRole === "admin";

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{parameterName || "Staff Management"}</CardTitle>

          <div>
            {/* Only show New Staff for admin */}
            {canEdit && (
              <Button onClick={() => crud.setCreating(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> New Staff
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    {/* Only show Actions header for admin */}
                    {canEdit && <TableHead className="w-48 text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {values.map((v: any) => (
                    <TableRow key={v.BookingParameterValueId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{v.BookingParameterValueCode}</TableCell>
                      <TableCell>{v.BookingParamterValueDescription}</TableCell>
                      <TableCell>{getColorBadge(String(v.BookingParameterValueId))}</TableCell>

                      {/* Only render action buttons when allowed */}
                      {canEdit && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => crud.openEdit(v)} title="Edit Staff">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openColorDialog(v)} title="Change Color">
                              <Palette className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEmailDialog(v)} title="Change Email">
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => crud.setDeleteItem(v)} title="Delete Staff">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {values.length === 0 && (
                    <TableRow>
                      {/* Adjust colspan to visible columns */}
                      <TableCell colSpan={canEdit ? 4 : 3} className="text-center py-6 text-muted-foreground">
                        No staff found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* -------------------- */}
      {/* CREATE DIALOG (from CRUD hook) */}
      {/* -------------------- */}
      <Dialog open={crud.creating} onOpenChange={(open) => !open && crud.setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Code</Label>
              <Input
                value={crud.newItem.BookingParameterValueCode}
                onChange={(e) => crud.setNewItem({ ...crud.newItem, BookingParameterValueCode: e.target.value })}
              />
            </div>

            <div>
              <Label>Name</Label>
              <Input
                value={crud.newItem.BookingParamterValueDescription}
                onChange={(e) => crud.setNewItem({ ...crud.newItem, BookingParamterValueDescription: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => crud.setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={crud.handleCreate} disabled={crud.creatingSaving}>
                {crud.creatingSaving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------- */}
      {/* EDIT DIALOG */}
      {/* -------------------- */}
      <Dialog
        open={crud.editing}
        onOpenChange={(open) => {
          if (!open) {
            crud.setEditing(false);
            crud.setEditItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>

          {crud.editItem && (
            <div className="grid gap-4">
              <div>
                <Label>Code</Label>
                <Input
                  value={crud.editItem.BookingParameterValueCode}
                  onChange={(e) => crud.setEditItem({ ...crud.editItem, BookingParameterValueCode: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={crud.editItem.BookingParamterValueDescription}
                  onChange={(e) => crud.setEditItem({ ...crud.editItem, BookingParamterValueDescription: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    crud.setEditing(false);
                    crud.setEditItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={crud.handleUpdate} disabled={crud.saving}>
                  {crud.saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------- */}
      {/* COLOR DIALOG */}
      {/* -------------------- */}
      <Dialog open={colorDialogOpen} onOpenChange={(open) => !open && setColorDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Staff Color</DialogTitle>
          </DialogHeader>

          {colorStaff && (
            <div className="grid gap-4">
              <div>
                <Label>Staff</Label>
                <Input value={colorStaff.BookingParameterValueCode || colorStaff.BookingParameterValueId} disabled />
              </div>

              <div>
                <Label>Current Color</Label>
                {currentColor && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: currentColor }} />
                    <span className="capitalize">{colorOptions.find((c) => c.value === currentColor)?.label || "Custom"}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="staffColorInput">Select New Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="staffColorInput"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <Input
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter a color code or use the color picker
                </p>
              </div>

              {selectedColor && (
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                      style={{
                        backgroundColor: selectedColor,
                        color: getContrastColor(selectedColor),
                      }}
                    >
                      Aa
                    </div>
                    <span>This is how the color will appear</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setColorDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateColor} disabled={updatingColor || !selectedColor}>
                  {updatingColor ? "Updating..." : "Update Color"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------- */}
      {/* EMAIL DIALOG */}
      {/* -------------------- */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => !open && setEmailDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Staff Email</DialogTitle>
          </DialogHeader>

          {emailStaff && (
            <div className="grid gap-4">
              <div>
                <Label>Staff</Label>
                <Input value={emailStaff.BookingParameterValueCode} disabled />
              </div>

              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter email address"
                  disabled={loadingEmail}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateEmail} disabled={updatingEmail || !email || loadingEmail}>
                  {updatingEmail ? "Updating..." : "Update Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------- */}
      {/* DELETE DIALOG (from CRUD hook) */}
      {/* -------------------- */}
      <Dialog open={!!crud.deleteItem} onOpenChange={(open) => { if (!open) crud.setDeleteItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <div>
            <p>
              Are you sure you want to delete staff <strong>{crud.deleteItem?.BookingParameterValueCode}</strong> (ID: {crud.deleteItem?.BookingParameterValueId})?
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => crud.setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={crud.handleDelete} disabled={crud.deleting}>
              {crud.deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
