"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Users, X } from "lucide-react";

export default function ServicesPage() {
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff assignments
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

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

  // Delete assignment state
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{
    serviceId: string;
    staffId: string;
    serviceCode: string;
    staffCode: string;
  } | null>(null);

  // read url params
  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const code = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

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
      setValues(param ? param.BookingParameterValue : []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!code) return;
    const res = await fetch(`/api/booking-setup/get-booking-setup?code=${code}`);
    const json = await res.json();
    if (!json.value || json.value.length === 0) return;

    const setup = json.value[0];
    const staffParam = setup.BookingParameter.find(
      (p: any) => p.BookingParameterCode.toLowerCase() === "staff"
    );

    setStaffList(staffParam?.BookingParameterValue || []);
  };

  const loadAssignments = async () => {
    if (!code) return;
    try {
      const res = await fetch(
        `/api/booking-service-staff-rela/get-booking-service-staff-rela?code=${code}`
      );
      if (res.ok) {
        const json = await res.json();
        setAssignments(json.value || []);
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  };

  useEffect(() => {
    loadValues();
    loadStaff();
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, parameterId]);

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
        _BookingParameterValueStaff: "No",
        _BookingParameterValueService: "Yes",
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

  // Assign function
  const handleAssignService = async () => {
    if (!selectedService || !selectedStaffId) return;
    setAssigning(true);

    try {
      const staff = staffList.find(
        (s) => s.BookingParameterValueId === selectedStaffId
      );
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId_Staff: "5",
        _ServiceId: String(selectedService.BookingParameterValueId),
        _StaffId: String(selectedStaffId),
        _StaffCode: staff?.BookingParameterValueCode || "",
      };

      const res = await fetch("/api/booking-service-staff-rela/create-booking-service-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Assignment failed");

      alert("Service assigned successfully!");
      setAssignDialogOpen(false);
      setSelectedStaffId(null);
      setSelectedService(null);
      await loadAssignments(); // Refresh assignments
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to assign service");
    } finally {
      setAssigning(false);
    }
  };

  // Delete assignment function
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setDeletingAssignment(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _ServiceId: assignmentToDelete.serviceId,
        _StaffId: assignmentToDelete.staffId,
      };

      const res = await fetch("/api/booking-service-staff-rela/delete-booking-service-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to delete assignment");

      alert("Assignment deleted successfully!");
      setAssignmentToDelete(null);
      await loadAssignments(); // Refresh assignments
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete assignment");
    } finally {
      setDeletingAssignment(false);
    }
  };

  // Get assigned staff for a service
  const getAssignedStaffForService = (serviceId: string) => {
    return assignments
      .filter((assignment: any) => assignment.ServiceId === serviceId)
      .map((assignment: any) => {
        const staff = staffList.find(
          (s) => s.BookingParameterValueId.toString() === assignment.StaffId
        );
        return {
          ...assignment,
          staffName: staff?.BookingParameterValueCode || "Unknown",
          staffDescription: staff?.BookingParamterValueDescription || "",
        };
      });
  };

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6">
      {/* Services Card */}
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Services</CardTitle>
          <Dialog
            open={creating}
            onOpenChange={(open) => !open && setCreating(false)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Service</DialogTitle>
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
                <div>
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    value={newItem.BookingParameterValueDuration}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        BookingParameterValueDuration: Number(e.target.value),
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
            <Button
              onClick={() => setCreating(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" /> New Service
            </Button>
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
                    <TableHead className="text-right w-40">
                      Duration (mins)
                    </TableHead>
                    <TableHead>Assigned Staff</TableHead>
                    <TableHead className="w-40 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {values.map((v: any) => {
                    const assignedStaff = getAssignedStaffForService(
                      v.BookingParameterValueId.toString()
                    );
                    return (
                      <TableRow
                        key={v.BookingParameterValueId}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>{v.BookingParameterValueId}</TableCell>
                        <TableCell className="font-medium">
                          {v.BookingParameterValueCode}
                        </TableCell>
                        <TableCell>
                          {v.BookingParamterValueDescription}
                        </TableCell>
                        <TableCell className="text-right">
                          {v.BookingParameterValueDuration}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assignedStaff.length > 0 ? (
                              assignedStaff.map((assignment) => (
                                <Badge
                                  key={`${assignment.ServiceId}-${assignment.StaffId}`}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3" />
                                  {assignment.staffName}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      setAssignmentToDelete({
                                        serviceId: assignment.ServiceId,
                                        staffId: assignment.StaffId,
                                        serviceCode:
                                          v.BookingParameterValueCode,
                                        staffCode: assignment.staffName,
                                      })
                                    }
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No staff assigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(v)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteItem(v)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedService(v);
                                setAssignDialogOpen(true);
                              }}
                            >
                              Assign Staff
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {values.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No services found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Dialogs */}
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
            <DialogTitle>Edit Service</DialogTitle>
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

              <div>
                <Label>Duration (mins)</Label>
                <Input
                  type="number"
                  value={editItem.BookingParameterValueDuration}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      BookingParameterValueDuration: Number(e.target.value),
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

      {/* Delete Service Confirmation Dialog */}
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
              Are you sure you want to delete service{" "}
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

      {/* Assign Staff Dialog */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => !open && setAssignDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Service to Staff</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Service</Label>
              <Input
                value={selectedService?.BookingParameterValueCode}
                disabled
              />
            </div>

            <div>
              <Label>Staff</Label>
              <Select
                value={selectedStaffId?.toString()}
                onValueChange={(value) => setSelectedStaffId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem
                      key={s.BookingParameterValueId}
                      value={s.BookingParameterValueId.toString()}
                    >
                      {s.BookingParameterValueCode} -{" "}
                      {s.BookingParamterValueDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignService} disabled={assigning}>
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirmation Dialog */}
      <Dialog
        open={!!assignmentToDelete}
        onOpenChange={(open) => {
          if (!open) setAssignmentToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Assignment</DialogTitle>
          </DialogHeader>

          <div>
            <p>
              Are you sure you want to remove staff{" "}
              <strong>{assignmentToDelete?.staffCode}</strong> from service{" "}
              <strong>{assignmentToDelete?.serviceCode}</strong>?
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setAssignmentToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssignment}
              disabled={deletingAssignment}
            >
              {deletingAssignment ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
