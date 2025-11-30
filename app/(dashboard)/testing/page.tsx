"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function TestingDialogPage() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  const [wholeDay, setWholeDay] = useState(false);
  const [reason, setReason] = useState<string>();
  
  // Staff data
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffCode, setSelectedStaffCode] = useState<string>();
  const [selectedStaffName, setSelectedStaffName] = useState<string>();
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch staff when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const res = await fetch("/api/booking-setup/get-booking-setup?code=MAIN");
        const json = await res.json();
        const setup = json.value?.[0];
        
        // Find Staff parameter (BookingParameterId: 2)
        const staffParam = setup?.BookingParameter?.find(
          (p: any) => p.BookingParameterId === 2
        );
        
        if (staffParam?.BookingParameterValue) {
          setStaffList(staffParam.BookingParameterValue);
        }
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [open]);

  // Auto-fill staff name when code is selected
  const handleStaffCodeChange = (code: string) => {
    setSelectedStaffCode(code);
    const staff = staffList.find((s) => s.BookingParameterValueCode === code);
    setSelectedStaffName(staff?.BookingParamterValueDescription || "");
  };

  // Submit handler
  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validation
    if (!selectedStaffCode || !selectedStaffName || !date || (!wholeDay && (!startTime || !endTime))) {
      setSubmitError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        _BookingSetupCode: "MAIN",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create time off");
      }

      setSubmitSuccess(true);
      // Reset form
      setSelectedStaffCode("");
      setSelectedStaffName("");
      setDate(undefined);
      setStartTime(undefined);
      setEndTime(undefined);
      setWholeDay(false);
      setReason("");
      
      // Close dialog after 2 seconds
      setTimeout(() => setOpen(false), 2000);
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="shadow-lg">
            Open Time Off Dialog
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl">Add Time Off</DialogTitle>
            <DialogDescription className="text-base">
              Provide the time-off information for the selected staff member.
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
                  <Select value={selectedStaffCode || ""} onValueChange={handleStaffCodeChange} disabled={loadingStaff}>
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
                  <Input readOnly className="bg-muted/50" value={selectedStaffName} placeholder="Auto-filled from selection" />
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
                        {timeOptions.map(t => (
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
                        {timeOptions.map(t => (
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
                Time off created successfully!
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t shrink-0 bg-background">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Add Time Off"}
            </Button>
          </div>
        </DialogContent>

      </Dialog>
    </div>
  );
}
