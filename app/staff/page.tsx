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
import { Edit, Trash2, Plus } from "lucide-react";

export default function StaffPage() {
  const [values, setValues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch(`/api/get-booking-setup?code=${code}`);
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

  useEffect(() => {
    loadValues();
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
        _BookingParamenterValueDesc: editItem.BookingParamterValueDescription,
        _BookingParameterValueDuration: String(
          editItem.BookingParameterValueDuration
        ),
        _BookingParameterValueStaff: "No",
        _BookingParameterValueService: "Yes",
      };

      const res = await fetch("/api/update-booking-parameter-value", {
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

      const res = await fetch("/api/delete-booking-parameter-value", {
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

      const res = await fetch("/api/create-booking-parameter-value", {
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

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Staff</CardTitle>
          <Dialog
            open={creating}
            onOpenChange={(open) => !open && setCreating(false)}
          >
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
            <Button
              onClick={() => setCreating(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" /> New Staff
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
                    <TableHead className="w-32 text-center">Actions</TableHead>
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

      {/* Delete Confirmation Dialog (simple) */}
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
