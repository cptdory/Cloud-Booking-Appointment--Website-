"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BusinessHoursForm } from "./business-hours-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BusinessHour {
  DayOfWeek: string;
  StarTime: string;
  EndTime: string;
  TimeIncrement: number;
}

export default function BusinessHoursPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHour, setEditingHour] = useState<BusinessHour | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; dayOfWeek: string }>({ open: false, dayOfWeek: "" });

  useEffect(() => {
    loadBusinessHours();
  }, [code]);

  const loadBusinessHours = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/get-booking-setup?code=${code}`);
      const json = await res.json();
      
      if (json.value && json.value.length > 0) {
        const hours = json.value[0].BookingBusinessHours || [];
        setBusinessHours(hours);
      }
    } catch (error) {
      toast.error("Failed to load business hours");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingHour(null);
    setShowForm(true);
  };

  const handleEdit = (hour: BusinessHour) => {
    setEditingHour(hour);
    setShowForm(true);
  };

  const handleDelete = async (dayOfWeek: string) => {
    try {
      const res = await fetch("/api/business-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          data: {
            bookingSetupCode: code,
            dayOfWeek: dayOfWeek,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Business hour deleted successfully");
      loadBusinessHours();
      setDeleteDialog({ open: false, dayOfWeek: "" });
    } catch (error) {
      toast.error("Failed to delete business hour");
    }
  };

  const formatTime = (time: string) => {
    // Convert from "09:00:00" to "09:00 AM"
    const [hours, minutes] = time.split(":");
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      MONDAY: "bg-blue-100 text-blue-800",
      TUESDAY: "bg-green-100 text-green-800",
      WEDNESDAY: "bg-yellow-100 text-yellow-800",
      THURSDAY: "bg-purple-100 text-purple-800",
      FRIDAY: "bg-red-100 text-red-800",
      SATURDAY: "bg-orange-100 text-orange-800",
      SUNDAY: "bg-gray-100 text-gray-800",
    };
    return colors[day] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-muted-foreground">Loading business hours...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center mb-5 justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Business Hours</h1>
              <p className="text-muted-foreground">
                Manage your business operating hours for {code}
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Business Hour
            </Button>
          </div>

          {/* Business Hours Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Business Hours</CardTitle>
              <CardDescription>
                Configure when your business is open for appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessHours.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No business hours configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add business hours to start accepting appointments
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Business Hour
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Time Increment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businessHours.map((hour, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="secondary" className={getDayColor(hour.DayOfWeek)}>
                            {hour.DayOfWeek}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatTime(hour.StarTime)}
                        </TableCell>
                        <TableCell>{formatTime(hour.EndTime)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {hour.TimeIncrement} minutes
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(hour)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, dayOfWeek: hour.DayOfWeek })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

      {/* Business Hours Form Dialog */}
      <BusinessHoursForm
        open={showForm}
        onOpenChange={setShowForm}
        businessHour={editingHour}
        bookingSetupCode={code}
        onSuccess={() => {
          setShowForm(false);
          loadBusinessHours();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, dayOfWeek: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the business hours for {deleteDialog.dayOfWeek}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.dayOfWeek)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}