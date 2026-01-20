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
import { Calendar as CalendarIcon, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useAlert, useModalAlert } from "@/hooks/useAlert";

// Generate time options with 15-minute intervals in 12-hour format (AM/PM)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      let displayHour = hour % 12 === 0 ? 12 : hour % 12;
      let ampm = hour < 12 ? "AM" : "PM";
      const timeStr = `${displayHour}:${String(minute).padStart(
        2,
        "0"
      )} ${ampm}`;
      options.push(timeStr);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export interface StaffTimeOffDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: {
    entryNo: string;
    staffCode: string;
    staffName: string;
    date: Date; // This will be treated as startDate
    endDate?: Date; // Optional end date for existing data
    startTime: string;
    endTime: string;
    wholeDay: boolean;
    reason: string;
  };
  onSuccess?: () => void;
  onError?: (title: string, message: string) => void;
}

export default function StaffTimeOffDialog({
  open: controlledOpen,
  onOpenChange: controlledOpenChange,
  initialData,

  onSuccess,
}: StaffTimeOffDialogProps) {
  const { userRole,bookingParameterValueId } = useAuth();
  const { showSuccess: showToastSuccess } = useToast();
  const { showError: showErrorAlert } = useModalAlert();
  const searchParams = useSearchParams();
  const bookingSetupCode = searchParams.get("code") || "MAIN";
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
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.date
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate || initialData?.date
  );

  // Single day switch: always true and not editable in edit mode
  const [isSingleDay, setIsSingleDay] = useState(true);
  const [startTime, setStartTime] = useState<string | undefined>(
    initialData?.startTime
  );

  const [endTime, setEndTime] = useState<string | undefined>(
    initialData?.endTime
  );

  const [wholeDay, setWholeDay] = useState(initialData?.wholeDay ?? false);
  const [reason, setReason] = useState<string | undefined>(initialData?.reason);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffCode, setSelectedStaffCode] = useState<
    string | undefined
  >(initialData?.staffCode);

  const [selectedStaffName, setSelectedStaffName] = useState<
    string | undefined
  >(initialData?.staffName);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Sync end date with start date for single-day time off
  useEffect(() => {
    if (isSingleDay) {
      setEndDate(startDate);
    } else if (endDate && startDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, isSingleDay]);

  // Fetch staff when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchStaff = async () => {
      setLoadingStaff(true);

      try {
        const res = await fetch(
          `/api/booking-setup/get-booking-setup?code=${bookingSetupCode}`
        );
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

        if (
          staffParam?.BookingParameterValue &&
          Array.isArray(staffParam.BookingParameterValue)
        ) {
          let filteredStaff = staffParam.BookingParameterValue;

          // If admin role, filter to only the current user's staff
          if (userRole === "user" && bookingParameterValueId) {
            const adminFiltered = filteredStaff.filter(
              (staffParam: any) => staffParam.BookingParameterValueId === bookingParameterValueId
            );

            // Only use filtered list if we found matches
            if (adminFiltered.length > 0) {
              filteredStaff = adminFiltered;
            }
          }
          // If admin, load all staff (no filter)
          setStaffList(filteredStaff);
          // Pre-select first staff for admin users
          if (userRole === "user" && filteredStaff.length > 0) {
            setSelectedStaffCode(filteredStaff[0].BookingParameterValueCode);

            setSelectedStaffName(
              filteredStaff[0].BookingParameterValueId
            );
          }
        } else {
          throw new Error("No staff values found");
        }
      } catch (err: any) {
        console.error("Failed to fetch staff:", err.message);

        showErrorAlert(
          "Error Loading Staff",
          `Failed to load staff: ${err.message}`
        );
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [open, userRole, bookingParameterValueId, bookingSetupCode]);

  useEffect(() => {
    if (initialData) {
      setStartDate(initialData.date);
      setEndDate(initialData.endDate || initialData.date);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setWholeDay(initialData.wholeDay);
      setReason(initialData.reason);
      setSelectedStaffCode(initialData.staffCode);
      setSelectedStaffName(initialData.staffName);
      setIsSingleDay(true);
    }
  }, [initialData]);

  // Auto-fill staff name when code is selected
  // const handleStaffCodeChange = (code: string) => {
  //   setSelectedStaffCode(code);
  //   const staff = staffList.find((s) => s.BookingParameterValueCode === code);
  //   setSelectedStaffName(staff?.BookingParamterValueDescription || "");
  // };

  // Handle whole day toggle - only clear times when user manually toggles to true
  const handleWholeDayToggle = (checked: boolean) => {
    setWholeDay(checked);
    if (checked) {
      setStartTime(undefined);
      setEndTime(undefined);
    }
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all values when closing
      setSelectedStaffCode(initialData?.staffCode || "");
      setSelectedStaffName(initialData?.staffName || "");
      setStartDate(initialData?.date);
      setEndDate(initialData?.endDate || initialData?.date);
      setIsSingleDay(true);
      setStartTime(initialData?.startTime);
      setEndTime(initialData?.endTime);
      setWholeDay(initialData?.wholeDay ?? false);
      setReason(initialData?.reason || "");
    }
    setOpen(newOpen);
  };

  // Submit handler (create or update)
  const handleSubmit = async () => {
    if (
      !selectedStaffCode ||
      !selectedStaffName ||
      !startDate ||
      !endDate ||
      (!wholeDay && (!startTime || !endTime))
    ) {
      showErrorAlert("Validation Error", "Please fill in all required fields");
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
          _TimeOffDate: format(startDate, "MM/dd/yyyy"),
          _TimeOffStartTime: wholeDay ? "" : startTime,
          _TimeOffEndTime: wholeDay ? "" : endTime,
          _WholeDay: String(wholeDay),
          _TimeOffReason: reason || "",
        };

        const res = await fetch(
          "/api/booking-staff-timeoff/update-booking-staff-timeoff",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to update time off");

        showToastSuccess("Time off updated successfully!");
      } else {
        // CREATE
        const body = {
          _BookingSetupCode: bookingSetupCode,
          _StaffCode: selectedStaffCode,
          _StaffName: selectedStaffName,
          _TimeOffStartDate: format(startDate, "MM/dd/yyyy"),
          _TimeOffEndDate: format(endDate, "MM/dd/yyyy"),
          _TimeOffStartTime: wholeDay ? "" : startTime,
          _TimeOffEndTime: wholeDay ? "" : endTime,
          _WholeDay: String(wholeDay),
          _TimeOffReason: reason || "",
        };

        const res = await fetch(
          "/api/booking-staff-timeoff/create-booking-staff-timeoff",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to create time off");
        showToastSuccess("Time off created successfully!");
      }
      // Close dialog immediately after success
      setOpen(false);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      showErrorAlert("Error", err.message || "An error occurred");

      // Keep dialog open on error for correction
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
            {isEditMode
              ? "Update time off details."
              : "Record time off for staff members."}
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
                <Label htmlFor="staff-name">Staff Name</Label>
                <Select
                  value={selectedStaffCode || ""}
                  onValueChange={(code) => {
                    setSelectedStaffCode(code);
                    const staff = staffList.find((s) => s.BookingParameterValueCode === code);
                    setSelectedStaffName(staff?.BookingParamterValueId || "");
                  }}
                  disabled={loadingStaff || isEditMode || (userRole === "user" && staffList.length === 1)}
                >
                  <SelectTrigger id="staff-name">
                    <SelectValue placeholder={loadingStaff ? "Loading..." : "Select staff name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem
                        key={staff.BookingParameterValueId}
                        value={staff.BookingParameterValueCode}
                      >
                        {staff.BookingParamterValueDescription}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {/* Single Day Switch */}

              {/* Single Day Switch */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="single-day-switch">Single Day</Label>
                <Switch
                  id="single-day-switch"
                  checked={isSingleDay}
                  disabled={isEditMode}
                  onCheckedChange={(checked) => {
                    if (!isEditMode) {
                      setIsSingleDay(checked);
                      if (checked && startDate) {
                        setEndDate(startDate);
                      }
                    }
                  }}
                />
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="start-date-input">Start Date</Label>
                <Input
                  id="start-date-input"
                  type="date"
                  value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? new Date(e.target.value)
                      : undefined;
                    setStartDate(val);
                    if (isSingleDay) setEndDate(val);
                    else if (endDate && val && endDate < val) setEndDate(val);
                  }}
                  max={endDate && !isSingleDay ? format(endDate, "yyyy-MM-dd") : undefined}
                />
              </div>

              {/* End Date */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="end-date-input">End Date</Label>
                <Input
                  id="end-date-input"
                  type="date"
                  value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (!isSingleDay) {
                      const val = e.target.value ? new Date(e.target.value) : undefined;
                      if (val && startDate && val < startDate) {
                        setEndDate(startDate);
                      } else {
                        setEndDate(val);
                      }
                    }
                  }}
                  readOnly={isSingleDay}
                  min={startDate ? format(startDate, "yyyy-MM-dd") : undefined}
                  className={cn(
                    isSingleDay && "bg-muted/50 cursor-not-allowed"
                  )}
                />
              </div>

              {/* Start Time */}

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="start-time">Start Time</Label>
                <Select
                  value={startTime || ""}
                  onValueChange={(val) => {
                    setStartTime(val);
                    // If endTime is before new startTime, reset endTime
                    if (endTime && timeOptions.indexOf(endTime) < timeOptions.indexOf(val)) {
                      setEndTime(val);
                    }
                  }}
                  disabled={wholeDay}
                >
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* End Time */}

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label htmlFor="end-time">End Time</Label>
                <Select
                  value={endTime || ""}
                  onValueChange={(val) => {
                    // Only allow endTime >= startTime
                    if (startTime && timeOptions.indexOf(val) < timeOptions.indexOf(startTime)) {
                      setEndTime(startTime);
                    } else {
                      setEndTime(val);
                    }
                  }}
                  disabled={wholeDay}
                >
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Whole Day */}

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <Label>Whole Day</Label>

                <Switch
                  checked={wholeDay}
                  onCheckedChange={handleWholeDayToggle}
                />
              </div>

              {/* Reason (Textarea) */}

              <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                <Label htmlFor="reason" className="mt-1">
                  Reason
                </Label>

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
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 pt-4 border-t shrink-0 bg-background">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Time Off"
                : "Add Time Off"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
