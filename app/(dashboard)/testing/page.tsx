"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const timeOptions = [
  "07:00", "08:00", "09:00", "10:00",
  "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00",
];

export default function TestingDialogPage() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  const [wholeDay, setWholeDay] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="shadow-lg">Open Time Off Dialog</Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Time Off</DialogTitle>
            <DialogDescription className="text-base">
              Provide the time-off information for the selected staff member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Staff Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Staff Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="staff-code" className="text-sm font-medium">
                    Staff Code
                  </Label>
                  <Select>
                    <SelectTrigger id="staff-code">
                      <SelectValue placeholder="Select staff code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S001">S001 - John Doe</SelectItem>
                      <SelectItem value="S002">S002 - Jane Smith</SelectItem>
                      <SelectItem value="S003">S003 - Mike Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="staff-name" className="text-sm font-medium">
                    Staff Name
                  </Label>
                  <Input 
                    id="staff-name"
                    readOnly 
                    className="bg-muted/50" 
                    placeholder="Auto-filled from selection" 
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Time Off Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Time Off Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="start-time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-time"
                        variant="outline"
                        disabled={wholeDay}
                        className={cn(
                          "w-full justify-start",
                          !startTime && "text-muted-foreground"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {startTime || "Select time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {timeOptions.map(t => (
                          <Button
                            key={t}
                            variant="ghost"
                            className="w-full justify-start hover:bg-accent"
                            onClick={() => setStartTime(t)}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="end-time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-time"
                        variant="outline"
                        disabled={wholeDay}
                        className={cn(
                          "w-full justify-start",
                          !endTime && "text-muted-foreground"
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {endTime || "Select time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {timeOptions.map(t => (
                          <Button
                            key={t}
                            variant="ghost"
                            className="w-full justify-start hover:bg-accent"
                            onClick={() => setEndTime(t)}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="whole-day" className="text-sm font-medium">
                    Whole Day
                  </Label>
                  <div className="flex items-center">
                    <Switch 
                      id="whole-day" 
                      checked={wholeDay}
                      onCheckedChange={setWholeDay}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4" />

            {/* Footer Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>
                Add Time Off
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}