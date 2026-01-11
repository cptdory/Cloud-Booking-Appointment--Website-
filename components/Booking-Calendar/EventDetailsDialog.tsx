"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Cake,
  Loader2,
} from "lucide-react";
import { CalendarEvent } from "@/types/calendarEvent";

interface EventDetailsDialogProps {
  selectedEvent: CalendarEvent | null;
  isModalOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: string) => Promise<void>;
  onDeleteTimeOff: () => Promise<void>;
  isUpdatingStatus: boolean;
  isDeletingTimeOff: boolean;
  userRole: string;
  staffCode: string;
  onShowTimeOffDialog: () => void;
}

export default function EventDetailsDialog({
  selectedEvent,
  isModalOpen,
  onOpenChange,
  onStatusChange,
  onDeleteTimeOff,
  isUpdatingStatus,
  isDeletingTimeOff,
  userRole,
  staffCode,
  onShowTimeOffDialog,
}: EventDetailsDialogProps) {
  const router = useRouter();

  if (!selectedEvent) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 dark:bg-slate-900">
        <DialogHeader className="px-6 py-5 border-b dark:border-slate-800">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-xl dark:text-slate-200">
            <span className="truncate">{selectedEvent?.title}</span>
            {selectedEvent && !selectedEvent?.extendedProps.rawData?.TimeOff && (
              <Badge
                variant={
                  selectedEvent.extendedProps.status === "Active"
                    ? "default"
                    : selectedEvent.extendedProps.status === "Finalized"
                    ? "secondary"
                    : "destructive"
                }
                className={cn(
                  "capitalize shrink-0 text-xs px-2 py-1",
                  selectedEvent.extendedProps.status === "Active" &&
                    "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
                  selectedEvent.extendedProps.status === "Finalized" &&
                    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
                  selectedEvent.extendedProps.status === "Cancelled" &&
                    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                )}
              >
                {selectedEvent.extendedProps.status}
              </Badge>
            )}
          </DialogTitle>
          {!selectedEvent?.extendedProps.rawData?.TimeOff && (
            <DialogDescription className="text-base dark:text-slate-400">
              Booking #{selectedEvent?.id} •{" "}
              {selectedEvent?.extendedProps.branch}
            </DialogDescription>
          )}
        </DialogHeader>

        {selectedEvent && (
          <div className="space-y-6 py-5 px-6">
            {/* Date & Time Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Schedule
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                  <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-slate-200">Date</p>
                    <p className="text-sm truncate dark:text-slate-300">
                      {new Date(selectedEvent.start).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-slate-200">Time</p>
                    <p className="text-sm dark:text-slate-300">
                      {new Date(selectedEvent.start).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}{" "}
                      -{" "}
                      {new Date(selectedEvent.end).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service & Staff Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Details
              </h3>
              <div className="space-y-3">
                {!selectedEvent.extendedProps.rawData?.TimeOff && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                    <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-slate-200">Service</p>
                      <p className="text-sm truncate dark:text-slate-300">
                        {selectedEvent.extendedProps.service}
                        {selectedEvent.extendedProps.rawData?.ServiceCode &&
                          ` (${selectedEvent.extendedProps.rawData.ServiceCode})`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                  <User className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-slate-200">Staff</p>
                    <p className="text-sm truncate dark:text-slate-300">
                      {selectedEvent.extendedProps.staff}
                      {selectedEvent.extendedProps.staffName &&
                        ` (${selectedEvent.extendedProps.staffCode})`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="dark:bg-slate-800" />

            {/* Show Customer Section ONLY if NOT Time Off */}
            {!selectedEvent.extendedProps.rawData?.TimeOff && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Customer Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-slate-200">Customer</p>
                      <p className="text-sm truncate dark:text-slate-300">
                        {selectedEvent.extendedProps.customer ||
                          "Not specified"}
                        {selectedEvent.extendedProps.rawData?.CustomerNo &&
                          ` (${selectedEvent.extendedProps.rawData.CustomerNo})`}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.extendedProps.rawData?.PhoneNo && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                      <Phone className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-slate-200">Phone</p>
                        <p className="text-sm dark:text-slate-300">
                          {selectedEvent.extendedProps.rawData.PhoneNo}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.EMail && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                      <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-slate-200">Email</p>
                        <p className="text-sm truncate dark:text-slate-300">
                          {selectedEvent.extendedProps.rawData.EMail}
                        </p>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.extendedProps.rawData?.Age ?? 0) > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                      <Cake className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-slate-200">Age</p>
                        <p className="text-sm dark:text-slate-300">
                          {selectedEvent.extendedProps.rawData?.Age} years old
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.extendedProps.rawData?.Address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-800">
                      <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-slate-200">Address</p>
                        <p className="text-sm dark:text-slate-300">
                          {selectedEvent.extendedProps.rawData.Address}
                          {selectedEvent.extendedProps.rawData.Address2 &&
                            `, ${selectedEvent.extendedProps.rawData.Address2}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {selectedEvent.extendedProps.description && (
              <>
                <Separator className="dark:bg-slate-800" />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    Notes
                  </h3>
                  <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed dark:text-slate-300">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t dark:border-slate-800 flex w-full">
          {/* Left Side: Cancel Button and Delete Time Off */}
          <div className="flex gap-2">
            {/* Cancel Button - Show only if status is Active and not TimeOff */}
            {selectedEvent && !selectedEvent.extendedProps.rawData?.TimeOff &&
              selectedEvent.extendedProps.status === "Active" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onStatusChange("Cancelled")}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Booking"
                  )}
                </Button>
              )}

            {/* Delete Time Off Button - Show only if is TimeOff and has permission */}
            {selectedEvent?.extendedProps.rawData?.TimeOff && (() => {
              const isGlobalAdmin = userRole === "global-admin";
              const isAdminWithMatchingStaff = userRole === "admin" && staffCode === selectedEvent.extendedProps.staffCode;
              const isOwnTimeOff = staffCode === selectedEvent.extendedProps.staffCode;
              const hasPermission = isGlobalAdmin || isAdminWithMatchingStaff || isOwnTimeOff;
              
              return hasPermission && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteTimeOff}
                  disabled={isDeletingTimeOff}
                >
                  {isDeletingTimeOff ? "Deleting..." : "Delete Time Off"}
                </Button>
              );
            })()}
          </div>

          {/* Right Side: Reschedule, Edit Time Off, and Close */}
          <div className="flex gap-2 ml-auto">
            {/* Reschedule Button - Show if not TimeOff and status is Active */}
            {selectedEvent && !selectedEvent.extendedProps.rawData?.TimeOff &&
              selectedEvent.extendedProps.status === "Active" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    router.push(
                      `/booking?reschedule=${selectedEvent.id}`
                    );
                  }}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Reschedule
                </Button>
              )}

            {/* Edit Time Off Button - Show only if is TimeOff and has permission */}
            {selectedEvent?.extendedProps.rawData?.TimeOff && (() => {
              const isGlobalAdmin = userRole === "global-admin";
              const isAdminWithMatchingStaff = userRole === "admin" && staffCode === selectedEvent.extendedProps.staffCode;
              const isOwnTimeOff = staffCode === selectedEvent.extendedProps.staffCode;
              const hasPermission = isGlobalAdmin || isAdminWithMatchingStaff || isOwnTimeOff;
              
              return hasPermission && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onShowTimeOffDialog();
                  }}
                >
                  Edit Time Off
                </Button>
              );
            })()}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
