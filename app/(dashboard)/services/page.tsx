"use client";

import React, { useEffect, useMemo, useState } from "react";

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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle, Edit, Trash2, Plus, Users } from "lucide-react";

import { useBookingParams } from "@/hooks/useBookingParams";
import { useParameterCRUD } from "@/hooks/useParameterCRUD";

/**
 * Page: app/(dashboard)/staff/page.tsx
 *
 * Re-uses:
 * - useBookingParams(code, parameterId)
 * - useParameterCRUD({ code, parameterId, isParamStaff, isParamService, loadValues, getItemType })
 *
 * Notes:
 * - This is intentionally compact: CRUD dialogs are driven by the hook.
 * - Assigned-staff fetch/create/delete operations remain on-page (they're specific to relation endpoints).
 */

export default function StaffPage() {
  // url params (same usage as before)
  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const code = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

  // Booking parameter data & flags (values = list of items for current parameter)
  const {
    values,
    loading,
    error,
    parameterName,
    isParamStaff,
    isParamService,
    checkDuration,
    loadValues,
  } = useBookingParams(code, parameterId);

  // CRUD hook for create/edit/delete of parameter values
  const crud = useParameterCRUD({
    code,
    parameterId,
    isParamStaff,
    isParamService,
    loadValues,
    getItemType: () => "staff",
  });

  // Staff list (lookup) - fetch once from booking setup (parameter code "staff")
  const [staffList, setStaffList] = useState<any[]>([]);
  const loadStaffList = async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/booking-setup/get-booking-setup?code=${code}`);
      const json = await res.json();
      const setup = json.value?.[0];
      const staffParam = setup?.BookingParameter?.find(
        (p: any) => String(p.BookingParameterCode).toLowerCase() === "staff"
      );
      setStaffList(staffParam?.BookingParameterValue || []);
    } catch (err) {
      // silent fallback (page shows error from useBookingParams if needed)
      console.error("loadStaffList error:", err);
    }
  };

  // Assigned staff dialog + state
  const [viewStaffDialogOpen, setViewStaffDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [loadingAssignedStaff, setLoadingAssignedStaff] = useState(false);

  // Assign dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Helpers
  const pageTitle = useMemo(() => parameterName || "Staff", [parameterName]);

  // load staff lookup + values
  useEffect(() => {
    loadValues();
    loadStaffList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, parameterId]);

  // ---------- Assigned staff operations (service-staff relation) ----------
  const loadAssignedStaff = async (serviceId: number) => {
    if (!code) return;
    setLoadingAssignedStaff(true);
    try {
      const res = await fetch("/api/booking-service-staff-rela/get-booking-service-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _BookingSetupCode: code, _ServiceId: String(serviceId) }),
      });
      const json = await res.json();
      let list: any[] = [];
      if (typeof json.value === "string") {
        try {
          list = JSON.parse(json.value);
        } catch {
          list = [];
        }
      } else if (Array.isArray(json.value)) {
        list = json.value;
      }
      setAssignedStaff(list);
    } catch (err: any) {
      console.error("loadAssignedStaff error:", err);
    } finally {
      setLoadingAssignedStaff(false);
    }
  };

  const openViewAssignedStaff = async (service: any) => {
    setSelectedService(service);
    setViewStaffDialogOpen(true);
    await loadAssignedStaff(service.BookingParameterValueId);
  };

  const deleteAssignedStaff = async (serviceId: number, staffId: number) => {
    if (!code) return;
    try {
      const res = await fetch("/api/booking-service-staff-rela/delete-booking-service-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _BookingSetupCode: code, _ServiceId: String(serviceId), _StaffId: String(staffId) }),
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
      // refresh
      await loadAssignedStaff(serviceId);
    } catch (err: any) {
      console.error("deleteAssignedStaff error:", err);
    }
  };

  const handleAssignService = async () => {
    if (!selectedService || !selectedStaffId || !code) return;
    setAssigning(true);
    try {
      const staff = staffList.find((s) => s.BookingParameterValueId === selectedStaffId);
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId_Staff: parameterId,
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
      // refresh assigned list for selected service
      await loadAssignedStaff(selectedService.BookingParameterValueId);
      setAssignDialogOpen(false);
      setSelectedStaffId(null);
      setSelectedService(null);
    } catch (err: any) {
      console.error("handleAssignService error:", err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6">
      {/* Success / Error from the CRUD hook */}
      {crud.success && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{crud.success}</AlertDescription>
        </Alert>
      )}

      {crud.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{crud.error}</AlertDescription>
        </Alert>
      )}

      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{pageTitle}</CardTitle>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => crud.setCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Staff
            </Button>
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
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-60 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((v: any) => (
                    <TableRow key={v.BookingParameterValueId} className="hover:bg-muted/50">
                      <TableCell>{v.BookingParameterValueId}</TableCell>
                      <TableCell className="font-medium">{v.BookingParameterValueCode}</TableCell>
                      <TableCell>{v.BookingParamterValueDescription}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => crud.openEdit(v)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => crud.setDeleteItem(v)}>
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
                            Assign
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openViewAssignedStaff(v)}>
                            <Users className="w-4 h-4 mr-1" /> View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {values.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
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

      {/* ------------------------
          Create Dialog (driven by crud hook)
         ------------------------ */}
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
              <Label>Description</Label>
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

      {/* ------------------------
          Edit Dialog (driven by crud hook)
         ------------------------ */}
      <Dialog open={crud.editing} onOpenChange={(open) => { if (!open) { crud.setEditing(false); crud.setEditItem(null); } }}>
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
                <Button variant="ghost" onClick={() => { crud.setEditing(false); crud.setEditItem(null); }}>
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

      {/* ------------------------
          Delete Confirmation (driven by crud hook)
         ------------------------ */}
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
            <Button variant="ghost" onClick={() => crud.setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={crud.handleDelete} disabled={crud.deleting}>
              {crud.deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------
          Assign Staff Dialog
         ------------------------ */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => !open && setAssignDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Item</Label>
              <Input value={selectedService?.BookingParameterValueCode || ""} disabled />
            </div>

            <div>
              <Label>Staff</Label>
              <Select value={selectedStaffId?.toString() || ""} onValueChange={(v) => setSelectedStaffId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.BookingParameterValueId} value={String(s.BookingParameterValueId)}>
                      {s.BookingParameterValueCode} - {s.BookingParamterValueDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignService} disabled={assigning}>
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ------------------------
          View Assigned Staff Dialog
         ------------------------ */}
      <Dialog open={viewStaffDialogOpen} onOpenChange={(open) => !open && setViewStaffDialogOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assigned for {selectedService?.BookingParameterValueCode}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {loadingAssignedStaff ? (
              <p className="text-muted-foreground">Loading assigned staff...</p>
            ) : assignedStaff.length === 0 ? (
              <p className="text-muted-foreground">No staff assigned.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Staff Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {assignedStaff.map((assignment: any) => {
                      const staff = staffList.find((s) => Number(s.BookingParameterValueId) === Number(assignment.StaffId));
                      return (
                        <TableRow key={`${assignment.ServiceId}-${assignment.StaffId}`}>
                          <TableCell>{assignment.StaffId}</TableCell>
                          <TableCell className="font-medium">{assignment.StaffCode}</TableCell>
                          <TableCell>{assignment.StaffName || staff?.BookingParamterValueDescription || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="destructive" onClick={() => deleteAssignedStaff(selectedService!.BookingParameterValueId, assignment.StaffId)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setViewStaffDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => { setViewStaffDialogOpen(false); setAssignDialogOpen(true); }}>
                Assign More
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
