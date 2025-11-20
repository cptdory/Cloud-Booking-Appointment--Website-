"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function BusinessHoursForm({
  open,
  onOpenChange,
  businessHour,
  bookingSetupCode,
  onSuccess,
}: BusinessHoursFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: businessHour?.DayOfWeek || "",
    startTime: businessHour?.StarTime.substring(0, 5) || "09:00",
    endTime: businessHour?.EndTime.substring(0, 5) || "17:00",
    timeIncrement: businessHour?.TimeIncrement.toString() || "30",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dayOfWeek) {
      toast.error("Please select a day of week");
      return;
    }

    setLoading(true);

    try {
      // Convert time to Business Central format (add seconds)
      const startTimeWithSeconds = `${formData.startTime}:00`;
      const endTimeWithSeconds = `${formData.endTime}:00`;

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
            startTime: startTimeWithSeconds,
            endTime: endTimeWithSeconds,
            timeIncrement: formData.timeIncrement,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(`Business hours ${businessHour ? "updated" : "created"} successfully`);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to ${businessHour ? "update" : "create"} business hours`);
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