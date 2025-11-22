"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BusinessHour {
  DayOfWeek: string;
  StarTime: string;
  EndTime: string;
  TimeIncrement: number;
}

interface BusinessHoursFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessHour: BusinessHour | null;
  bookingSetupCode: string;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TIME_INCREMENT_OPTIONS = [15, 30, 60, 90, 120];

// Convert 12h time to 24h format for input[type="time"]
function convertTo24HourFormat(time12h: string): string {
  if (!time12h) return "09:00";
  
  // If it's already in 24h format (from API response)
  if (time12h.includes(':')) {
    const [hours, minutes] = time12h.split(':');
    if (minutes && minutes.length === 2) {
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
  }
  
  // If it's in 12h format "10:00 AM"
  const [time, period] = time12h.split(' ');
  if (!time || !period) return "09:00";
  
  let [hours, minutes] = time.split(':');
  if (period.toUpperCase() === 'PM' && hours !== '12') {
    hours = (parseInt(hours) + 12).toString();
  } else if (period.toUpperCase() === 'AM' && hours === '12') {
    hours = '00';
  }
  
  return `${hours.padStart(2, '0')}:${minutes || '00'}`;
}

function BusinessHoursForm({
  open,
  onOpenChange,
  businessHour,
  bookingSetupCode,
  onSuccess,
}: BusinessHoursFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: "",
    startTime: "09:00",
    endTime: "17:00",
    timeIncrement: "30",
  });

  // Reset form when businessHour changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (businessHour) {
        // Editing mode - set current values (convert from 12h to 24h for input)
        setFormData({
          dayOfWeek: businessHour.DayOfWeek,
          startTime: convertTo24HourFormat(businessHour.StarTime),
          endTime: convertTo24HourFormat(businessHour.EndTime),
          timeIncrement: businessHour.TimeIncrement.toString(),
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          dayOfWeek: "",
          startTime: "09:00",
          endTime: "17:00",
          timeIncrement: "30",
        });
      }
    }
  }, [open, businessHour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dayOfWeek) {
      toast.error("Please select a day of week");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/business-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: businessHour ? "update" : "create",
          data: {
            bookingSetupCode,
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            timeIncrement: parseInt(formData.timeIncrement),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save");
      }

      toast.success(`Business hours ${businessHour ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving business hours:', error);
      toast.error(error.message || `Failed to ${businessHour ? "update" : "create"} business hours`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {businessHour ? "Edit Business Hours" : "Add Business Hours"}
          </DialogTitle>
          <DialogDescription>
            Configure the operating hours for your business.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select
              value={formData.dayOfWeek}
              onValueChange={(value) => handleInputChange("dayOfWeek", value)}
              disabled={!!businessHour}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {businessHour && (
              <p className="text-xs text-muted-foreground">
                Day cannot be changed when editing
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeIncrement">Time Increment (minutes)</Label>
            <Select
              value={formData.timeIncrement}
              onValueChange={(value) => handleInputChange("timeIncrement", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select increment" />
              </SelectTrigger>
              <SelectContent>
                {TIME_INCREMENT_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : businessHour ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Separate component that uses useSearchParams
function BusinessHoursContent() {
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
      const res = await fetch(`/api/booking-setup/get-booking-setup?code=${code}`);
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
              <div className="text-lg text-muted-foreground">Loading business information...</div>
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
          <h1 className="text-3xl font-bold tracking-tight">Business Information</h1>
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

// Loading component for Suspense fallback
function BusinessHoursLoading() {
  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <div className="flex items-center mb-5 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Information</h1>
          <p className="text-muted-foreground">Loading business information...</p>
        </div>
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          Add Business Hour
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Business Hours</CardTitle>
          <CardDescription>Loading business hours...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading business hours...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with Suspense boundary
export default function BusinessHoursPage() {
  return (
    <Suspense fallback={<BusinessHoursLoading />}>
      <BusinessHoursContent />
    </Suspense>
  );
}