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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Key, Palette } from "lucide-react";

export default function StaffPage() {
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffColors, setStaffColors] = useState<{[key: string]: {background: string; text: string}}>({});

  // Edit Dialog state
  const [editing, setEditing] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  // Create Dialog state
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    BookingParameterValueCode: "",
    BookingParamterValueDescription: "",
    BookingParameterValueDuration: 60,
  });
  const [creatingSaving, setCreatingSaving] = useState(false);

  // Color Dialog state
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorStaff, setColorStaff] = useState<any | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [updatingColor, setUpdatingColor] = useState(false);

  // Password Dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordStaff, setPasswordStaff] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // read url params
  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const code = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

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

  const loadValues = async () => {
    if (!code || !parameterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking-setup/get-booking-setup?code=${code}`);
      const json = await res.json();
      if (!json.value || json.value.length === 0) {
        setValues([]);
        setLoading(false);
        return;
      }
      const setup = json.value[0];
      const param = setup.BookingParameter.find(
        (p: any) => p.BookingParameterId.toString() === parameterId
      );
      const staffValues = param ? param.BookingParameterValue : [];
      setValues(staffValues);
      
      // Load colors for all staff
      if (staffValues.length > 0) {
        await loadStaffColors(staffValues);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Load colors for all staff members
  const loadStaffColors = async (staffList: any[]) => {
    try {
      const staffCodes = staffList.map(staff => staff.BookingParameterValueCode);
      
      const body = {
        staffCodes: staffCodes,
        branchCode: code
      };

      console.log("🎨 Loading colors for staff:", body);

      const res = await fetch("/api/booking-staff-auth/get-booking-staff-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log("🎨 Color response:", json);

      if (res.ok && json.staffColors) {
        setStaffColors(json.staffColors);
      }
    } catch (err) {
      console.error("Failed to load staff colors:", err);
    }
  };

  // Get color for a specific staff member
  const getStaffColorStyle = (staffCode: string) => {
    const color = staffColors[staffCode];
    if (color) {
      return {
        backgroundColor: color.background,
        color: color.text,
      };
    }
    return {
      backgroundColor: '#6b7280', // default gray
      color: '#ffffff',
    };
  };

  // Get color badge for display
  const getColorBadge = (staffCode: string) => {
    const color = staffColors[staffCode];
    if (!color) {
      return <Badge variant="secondary" className="bg-gray-500 text-white">Gray</Badge>;
    }

    const colorName = colorOptions.find(opt => opt.value === color.background)?.label || 'Custom';
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

  // Open color dialog
  const openColorDialog = async (staff: any) => {
    setColorStaff(staff);
    setColorDialogOpen(true);
    
    // Get current color from staffColors state
    const currentStaffColor = staffColors[staff.BookingParameterValueCode];
    if (currentStaffColor) {
      setCurrentColor(currentStaffColor.background);
      setSelectedColor(currentStaffColor.background);
    } else {
      setCurrentColor("#6b7280"); // default gray
      setSelectedColor("#6b7280");
    }
  };

  // Update staff color
  const handleUpdateColor = async () => {
    if (!colorStaff || !selectedColor) return;
    setUpdatingColor(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(colorStaff.BookingParameterValueId),
        _StaffColor: selectedColor,
      };

      console.log("🎨 Updating color with body:", body);

      const res = await fetch("/api/booking-staff-auth/update-booking-staff-auth-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update color");

      // Update local state
      setStaffColors(prev => ({
        ...prev,
        [colorStaff.BookingParameterValueCode]: {
          background: selectedColor,
          text: getContrastColor(selectedColor)
        }
      }));

      alert("Staff color updated successfully!");
      setColorDialogOpen(false);
      setColorStaff(null);
      setSelectedColor("");
      setCurrentColor("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update color");
    } finally {
      setUpdatingColor(false);
    }
  };

  // Helper function to determine text color based on background brightness
  function getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Open password dialog
  const openPasswordDialog = (staff: any) => {
    setPasswordStaff(staff);
    setPasswordDialogOpen(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  // Update staff password
  const handleUpdatePassword = async () => {
    if (!passwordStaff || !newPassword) return;
    
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setUpdatingPassword(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(passwordStaff.BookingParameterValueId),
        _PortalPassword: newPassword,
      };

      const res = await fetch("/api/booking-staff-auth/update-booking-staff-auth-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update password");

      alert("Staff password updated successfully!");
      setPasswordDialogOpen(false);
      setPasswordStaff(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Edit functions
  const openEdit = (item: any) => {
    setEditItem({
      BookingParameterValueId: item.BookingParameterValueId,
      BookingParameterValueCode: item.BookingParameterValueCode,
      BookingParamterValueDescription:
        item.BookingParamterValueDescription || "",
      BookingParameterValueDuration: item.BookingParameterValueDuration || 60,
    });
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(editItem.BookingParameterValueId),
        _BookingParameterValueCode: String(editItem.BookingParameterValueCode),
        _BookingParamenterValueDesc: editItem.BookingParamterValueDescription,
        _BookingParameterValueDuration: String(
          editItem.BookingParameterValueDuration
        ),
        _BookingParameterValueStaff: "No",
        _BookingParameterValueService: "Yes",
      };

      const res = await fetch("/api/booking-parameter/update-booking-parameter-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Update failed");

      await loadValues();
      setEditing(false);
      setEditItem(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // Delete functions
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(deleteItem.BookingParameterValueId),
      };

      const res = await fetch("/api/booking-parameter/delete-booking-parameter-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      await loadValues();
      setDeleteItem(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // Create function
  const handleCreate = async () => {
    setCreatingSaving(true);
    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueCode: newItem.BookingParameterValueCode,
        _BookingParameterValueDesc: newItem.BookingParamterValueDescription,
        _BookingParameterValueDuration: String(
          newItem.BookingParameterValueDuration
        ),
        _BookingParameterValueStaff: "Yes",
        _BookingParameterValueService: "No",
      };

      const res = await fetch("/api/booking-parameter/create-booking-parameter-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Create failed");

      await loadValues();
      setCreating(false);
      setNewItem({
        BookingParameterValueCode: "",
        BookingParamterValueDescription: "",
        BookingParameterValueDuration: 60,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create");
    } finally {
      setCreatingSaving(false);
    }
  };

  useEffect(() => {
    loadValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, parameterId]);

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Staff Management</CardTitle>
          <Dialog
            open={creating}
            onOpenChange={(open) => !open && setCreating(false)}
          >
            <Button
              onClick={() => setCreating(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" /> New Staff
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Staff</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={newItem.BookingParameterValueCode}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        BookingParameterValueCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newItem.BookingParamterValueDescription}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        BookingParamterValueDescription: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={creatingSaving}>
                    {creatingSaving ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="w-48 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {values.map((v: any) => (
                    <TableRow
                      key={v.BookingParameterValueId}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>{v.BookingParameterValueId}</TableCell>
                      <TableCell className="font-medium">
                        {v.BookingParameterValueCode}
                      </TableCell>
                      <TableCell>{v.BookingParamterValueDescription}</TableCell>
                      <TableCell>
                        {getColorBadge(v.BookingParameterValueCode)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(v)}
                            title="Edit Staff"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openColorDialog(v)}
                            title="Change Color"
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openPasswordDialog(v)}
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteItem(v)}
                            title="Delete Staff"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {values.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
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

      {/* Edit Dialog */}
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(false);
            setEditItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>

          {editItem && (
            <div className="grid gap-4">
              <div>
                <Label>Code</Label>
                <Input
                  value={editItem.BookingParameterValueCode}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      BookingParameterValueCode: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={editItem.BookingParamterValueDescription}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      BookingParamterValueDescription: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Color Dialog */}
      <Dialog
        open={colorDialogOpen}
        onOpenChange={(open) => !open && setColorDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Staff Color</DialogTitle>
          </DialogHeader>

          {colorStaff && (
            <div className="grid gap-4">
              <div>
                <Label>Staff</Label>
                <Input
                  value={colorStaff.BookingParameterValueCode}
                  disabled
                />
              </div>

              <div>
                <Label>Current Color</Label>
                {currentColor && (
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="capitalize">
                      {colorOptions.find(c => c.value === currentColor)?.label || 'Custom'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label>New Color</Label>
                <Select
                  value={selectedColor}
                  onValueChange={setSelectedColor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedColor && (
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                      style={{
                        backgroundColor: selectedColor,
                        color: getContrastColor(selectedColor)
                      }}
                    >
                      Aa
                    </div>
                    <span>This is how the color will appear</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setColorDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateColor} 
                  disabled={updatingColor || !selectedColor}
                >
                  {updatingColor ? "Updating..." : "Update Color"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => !open && setPasswordDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Staff Password</DialogTitle>
          </DialogHeader>

          {passwordStaff && (
            <div className="grid gap-4">
              <div>
                <Label>Staff</Label>
                <Input
                  value={passwordStaff.BookingParameterValueCode}
                  disabled
                />
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={updatingPassword || !newPassword || !confirmPassword}
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <div>
            <p>
              Are you sure you want to delete staff{" "}
              <strong>{deleteItem?.BookingParameterValueCode}</strong> (ID:{" "}
              {deleteItem?.BookingParameterValueId})?
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}