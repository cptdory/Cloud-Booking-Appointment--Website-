"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const timeOptions = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

interface StaffTimeOffDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    entryNo: string;
    staffCode: string;
    staffName: string;
    date: Date;
    startTime: string;
    endTime: string;
    wholeDay: boolean;
    reason: string;
  };
  onSuccess?: () => void;
}

export default function StaffTimeOffDialog({
  open: controlledOpen,
  onOpenChange: controlledOpenChange,
  initialData,
  onSuccess,
}: StaffTimeOffDialogProps) {
  const { userRole, username } = useAuth();
  const searchParams = useSearchParams();
  const bookingSetupCode = searchParams.get("code") || "MAIN";

  // Use controlled or internal state
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpenChange) {
      controlledOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const isEditMode = !!initialData;

  const [date, setDate] = useState<Date | undefined>(initialData?.date);
  const [startTime, setStartTime] = useState<string | undefined>(initialData?.startTime);
  const [endTime, setEndTime] = useState<string | undefined>(initialData?.endTime);
  const [wholeDay, setWholeDay] = useState(initialData?.wholeDay ?? false);
  const [reason, setReason] = useState<string | undefined>(initialData?.reason);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffCode, setSelectedStaffCode] = useState<string | undefined>(initialData?.staffCode);
  const [selectedStaffName, setSelectedStaffName] = useState<string | undefined>(initialData?.staffName);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch staff when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const res = await fetch(`/api/booking-setup/get-booking-setup?code=${bookingSetupCode}`);
        const json = await res.json();
        const setup = json.value?.[0];
        
        if (!setup) {
          throw new Error("No booking setup found");
        }

        // Find Staff parameter by code "STAFF" (more reliable than ID)
        const staffParam = setup?.BookingParameter?.find(
          (p: any) => String(p.BookingParameterCode).toLowerCase() === "staff"
        );
        
        if (!staffParam) {
          throw new Error("Staff parameter not found in booking setup");
        }

        if (staffParam?.BookingParameterValue && Array.isArray(staffParam.BookingParameterValue)) {
          let filteredStaff = staffParam.BookingParameterValue;

          // If admin role, filter to only the current user's staff
          if (userRole === "admin" && username) {
            const adminFiltered = filteredStaff.filter(
              (staff: any) => staff.BookingParamterValueDescription === username
            );
            
            // Only use filtered list if we found matches
            if (adminFiltered.length > 0) {
              filteredStaff = adminFiltered;
            }
          }
          // If global-admin, load all staff (no filter)

          setStaffList(filteredStaff);
          
          // Pre-select first staff for admin users
          if (userRole === "admin" && filteredStaff.length > 0) {
            setSelectedStaffCode(filteredStaff[0].BookingParameterValueCode);
            setSelectedStaffName(filteredStaff[0].BookingParamterValueDescription);
          }
        } else {
          throw new Error("No staff values found");
        }
      } catch (err: any) {
        console.error("Failed to fetch staff:", err.message);
        setSubmitError(`Failed to load staff: ${err.message}`);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [open, userRole, username, bookingSetupCode]);

  // Auto-fill staff name when code is selected
  const handleStaffCodeChange = (code: string) => {
    setSelectedStaffCode(code);
    const staff = staffList.find((s) => s.BookingParameterValueCode === code);
    setSelectedStaffName(staff?.BookingParamterValueDescription || "");
  };

  // Submit handler (create or update)
  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!selectedStaffCode || !selectedStaffName || !date || (!wholeDay && (!startTime || !endTime))) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // UPDATE
        const body = {
          _BookingSetupCode: bookingSetupCode,
          _BookingEntryNo: String(initialData.entryNo),
          _StaffCode: selectedStaffCode,
          _StaffName: selectedStaffName,
          _TimeOffDate: format(date, "MM/dd/yyyy"),
          _TimeOffStartTime: wholeDay ? "" : startTime,
          _TimeOffEndTime: wholeDay ? "" : endTime,
          _WholeDay: String(wholeDay),
          _TimeOffReason: reason || "",
        };

        const res = await fetch("/api/booking-staff-timeoff/update-booking-staff-timeoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update time off");

        setSubmitSuccess(true);
      } else {
        // CREATE
        const body = {
          _BookingSetupCode: bookingSetupCode,
          _StaffCode: selectedStaffCode,
          _StaffName: selectedStaffName,
          _TimeOffDate: format(date, "MM/dd/yyyy"),
          _TimeOffStartTime: wholeDay ? "" : startTime,
          _TimeOffEndTime: wholeDay ? "" : endTime,
          _WholeDay: String(wholeDay),
          _TimeOffReason: reason || "",
        };

        const res = await fetch("/api/booking-staff-timeoff/create-booking-staff-timeoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create time off");

        setSubmitSuccess(true);
      }

      // Reset form
      setSelectedStaffCode("");
      setSelectedStaffName("");
      setDate(undefined);
      setStartTime(undefined);
      setEndTime(undefined);
      setWholeDay(false);
      setReason("");

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 gap-2">
          <Clock3 className="w-4 h-4" />
          <span className="hidden sm:inline">Add Time Off</span>
          <span className="sm:hidden">Time Off</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl">
            {isEditMode ? "Edit Staff Time Off" : "Add Staff Time Off"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditMode ? "Update time off details." : "Record time off for staff members."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 mt-2">

          {/* Staff Details */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Staff Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="staff-code">Staff Code</Label>
                <Select
                  value={selectedStaffCode || ""}
                  onValueChange={handleStaffCodeChange}
                  disabled={loadingStaff || (isEditMode) || (userRole === "admin" && staffList.length === 1)}
                >
                  <SelectTrigger id="staff-code">
                    <SelectValue placeholder={loadingStaff ? "Loading..." : "Select staff code"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.BookingParameterValueId} value={staff.BookingParameterValueCode}>
                        {staff.BookingParameterValueCode} - {staff.BookingParamterValueDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>Staff Name</Label>
                <Input
                  readOnly
                  className="bg-muted/50"
                  value={selectedStaffName}
                  placeholder="Auto-filled from selection"
                />
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* Time Off Details */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Time Off Details
            </h3>

            <div className="space-y-4">

              {/* Date */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start Time */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>Start Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={wholeDay}
                      className={cn("w-full justify-start", !startTime && "text-muted-foreground")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {startTime || "Select time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0">
                    <div className="max-h-60 overflow-y-auto">
                      {timeOptions.map((t) => (
                        <Button
                          key={t}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setStartTime(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Time */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>End Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={wholeDay}
                      className={cn("w-full justify-start", !endTime && "text-muted-foreground")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {endTime || "Select time"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0">
                    <div className="max-h-60 overflow-y-auto">
                      {timeOptions.map((t) => (
                        <Button
                          key={t}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setEndTime(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Whole Day */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>Whole Day</Label>
                <Switch checked={wholeDay} onCheckedChange={setWholeDay} />
              </div>

              {/* Reason (Textarea) */}
              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <Label htmlFor="reason" className="mt-1">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for time off..."
                  value={reason || ""}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

            </div>
          </section>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {isEditMode ? "Time off updated successfully!" : "Time off created successfully!"}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t shrink-0 bg-background">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Time Off" : "Add Time Off"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}