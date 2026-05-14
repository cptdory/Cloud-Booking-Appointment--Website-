"use client";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useBookingParams } from "@/hooks/useBookingParams";
import { useParameterCRUD } from "@/hooks/useParameterCRUD";
import { useAuth } from "@/hooks/useAuth";

export default function ParameterPage() {
  // URL Params
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams("");
  const code = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

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

  // Name used in success messages
  const getItemType = () => {
    if (isParamService === "true") return "service";
    if (isParamStaff === "true") return "staff";
    return "item";
  };

  const crud = useParameterCRUD({
    code,
    parameterId,
    isParamStaff,
    isParamService,
    loadValues,
    getItemType,
  });

  // auth + permission
  const { userRole } = useAuth();
  const canEdit = userRole === "admin";

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      {/* MAIN CARD */}
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{parameterName}</CardTitle>

          {/* Only show New when admin */}
          {canEdit && (
            <Button onClick={() => crud.setCreating(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> New {getItemType()}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    {checkDuration === "true" && <TableHead>Duration</TableHead>}
                    {/* Only show Actions header for admin */}
                    {canEdit && <TableHead className="text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {values.map((v) => (
                    <TableRow key={v.BookingParameterValueId}>
                      <TableCell>{v.BookingParameterValueCode}</TableCell>
                      <TableCell>{v.BookingParameterValueDescription}</TableCell>
                      {checkDuration === "true" && (
                        <TableCell>{v.BookingParameterValueDuration}</TableCell>
                      )}

                      {/* Only render action buttons when allowed */}
                      {canEdit && (
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => crud.openEdit(v)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => crud.setDeleteItem(v)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={crud.creating} onOpenChange={crud.setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {getItemType()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-code">Code</Label>
              <Input
                id="create-code"
                placeholder="Code"
                value={crud.newItem.BookingParameterValueCode}
                onChange={(e) =>
                  crud.setNewItem({
                    ...crud.newItem,
                    BookingParameterValueCode: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                placeholder="Name"
                value={crud.newItem.BookingParameterValueDescription}
                onChange={(e) =>
                  crud.setNewItem({
                    ...crud.newItem,
                    BookingParameterValueDescription: e.target.value,
                  })
                }
              />
            </div>
            {checkDuration === "true" && (
              <div>
                <Label htmlFor="create-duration">Duration (minutes)</Label>
                <Input
                  id="create-duration"
                  type="number"
                  placeholder="Duration"
                  value={crud.newItem.BookingParameterValueDuration}
                  onChange={(e) =>
                    crud.setNewItem({
                      ...crud.newItem,
                      BookingParameterValueDuration: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => crud.setCreating(false)}>
                Cancel
              </Button>
              <Button onClick={crud.handleCreate} disabled={crud.creatingSaving}>
                {crud.creatingSaving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={crud.editing} onOpenChange={crud.setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {getItemType()}</DialogTitle>
          </DialogHeader>
          {crud.editItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  placeholder="Code"
                  value={crud.editItem.BookingParameterValueCode}
                  onChange={(e) =>
                    crud.setEditItem({
                      ...crud.editItem,
                      BookingParameterValueCode: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Name"
                  value={crud.editItem.BookingParameterValueDescription}
                  onChange={(e) =>
                    crud.setEditItem({
                      ...crud.editItem,
                      BookingParameterValueDescription: e.target.value,
                    })
                  }
                />
              </div>
              {checkDuration === "true" && (
                <div>
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    placeholder="Duration"
                    value={crud.editItem.BookingParameterValueDuration}
                    onChange={(e) =>
                      crud.setEditItem({
                        ...crud.editItem,
                        BookingParameterValueDuration: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => crud.setEditing(false)}>
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

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!crud.deleteItem} onOpenChange={(open) => !open && crud.setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {getItemType()}</DialogTitle>
          </DialogHeader>
          {crud.deleteItem && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{crud.deleteItem.BookingParameterValueDescription}</strong>?
              </p>
              <p className="text-sm text-slate-500">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => crud.setDeleteItem(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={crud.handleDelete} disabled={crud.deleting}>
                  {crud.deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
