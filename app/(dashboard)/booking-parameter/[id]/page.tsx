"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2, CalendarDays } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { sileo } from "sileo";

/* =========================================================
   TYPES
========================================================= */

type BookingParameterValue = {
  Id: string;
  Code: string;
  Description: string;
  Duration: number;
  Staff: boolean;
  Service: boolean;
  ServiceSequence: string;
  ServicePrice?: string | number;
  BookingParameterValueServicePrice?: string | number;
};

type AuthUser = {
  booking_setup_code: string;
  booking_parameter_id: number;
  booking_parameter_value_id: number;
  staff_code: string;
  name: string;
  email: string;
  is_admin: boolean;
  role: string;
  tenant_id: string;
};

type Auth = {
  user: AuthUser;
};

type StaffItem = {
  id: string;
  code: string;
  description: string;
};

type StaffTimeoffEntry = {
  StaffCode: string;
  StaffName: string;
  Day: string;
  FromTime: string;
  ToTime: string;
  WholeDay: string;
};

const sortByServiceSequence = (items: BookingParameterValue[]) =>
  [...items].sort((a, b) => {
    const aSequence = Number(a.ServiceSequence ?? 0);
    const bSequence = Number(b.ServiceSequence ?? 0);

    if (Number.isNaN(aSequence) && Number.isNaN(bSequence)) return 0;
    if (Number.isNaN(aSequence)) return 1;
    if (Number.isNaN(bSequence)) return -1;

    return aSequence - bSequence;
  });

const normalizeQuarterHour = (value: string) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue < 0) {
    return "0";
  }

  return String(Math.round(numericValue / 15) * 15);
};

/* =========================================================
   CONTENT COMPONENT
========================================================= */

const BookingParameterContent = ({
  values,
  bookingSetupCode,
  bookingParameterId,
  parameterCode,
  auth,
  onRefresh,
}: {
  values: BookingParameterValue[];
  bookingSetupCode: string;
  bookingParameterId: string;
  parameterCode: string;
  auth: Auth | null;
  onRefresh: () => Promise<void>;
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("0");
  const [sequence, setSequence] = useState("0");
  const [price, setPrice] = useState("0");
  const [open, setOpen] = useState(false);

  // Staff color & email states
  const [staffColors, setStaffColors] = useState<Record<string, string>>({});
  const [staffEmails, setStaffEmails] = useState<Record<string, string>>({});
  const [colorEditingId, setColorEditingId] = useState<string | null>(null);
  const [colorEditingValue, setColorEditingValue] = useState("#d1d5db");
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorUpdating, setColorUpdating] = useState(false);
  const [emailEditingId, setEmailEditingId] = useState<string | null>(null);
  const [emailEditingValue, setEmailEditingValue] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Staff assignment states
  const [staffAssignmentDialogOpen, setStaffAssignmentDialogOpen] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [viewingItemCode, setViewingItemCode] = useState("");
  const [staffAssignmentsList, setStaffAssignmentsList] = useState<
    Array<{ staffId: string; staffCode: string; staffName: string }>
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [staffParameterId, setStaffParameterId] = useState("");

  // Staff time-off states
  const [timeoffDialogOpen, setTimeoffDialogOpen] = useState(false);
  const [newTimeoffDialogOpen, setNewTimeoffDialogOpen] = useState(false);
  const [timeoffLoading, setTimeoffLoading] = useState(false);
  const [timeoffList, setTimeoffList] = useState<StaffTimeoffEntry[]>([]);
  const [timeoffStaffId, setTimeoffStaffId] = useState<string | null>(null);
  const [timeoffStaffCode, setTimeoffStaffCode] = useState("");
  const [timeoffStaffName, setTimeoffStaffName] = useState("");
  const [timeoffEditingIndex, setTimeoffEditingIndex] = useState<number | null>(null);
  const [timeoffDay, setTimeoffDay] = useState("Monday");
  const [timeoffFromTime, setTimeoffFromTime] = useState("12:00:00 AM");
  const [timeoffToTime, setTimeoffToTime] = useState("11:59:00 PM");
  const [timeoffWholeDay, setTimeoffWholeDay] = useState("No");
  const [timeoffSubmitting, setTimeoffSubmitting] = useState(false);
  const [timeoffDeleting, setTimeoffDeleting] = useState(false);

  // Determine type based on values
  const isStaff = values.some((v) => v.Staff);
  const isService = values.some((v) => v.Service);
  const isRoom = !isStaff && !isService;

  const staffValues = values.filter((v) => v.Staff);

  // Stable string key for useEffect dependencies
  const valueIds = useMemo(() => values.map((v) => v.Id).join(","), [values]);

  // Load staff colors and emails on mount
  useEffect(() => {
    if (values.length === 0) return;

    let isCancelled = false;

    const loadColors = async () => {
      try {
        for (const value of values) {
          if (!isCancelled) {
            const res = await fetch(
              "/api/booking-staff-details/get-booking-staff-color",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingSetupCode,
                  bookingParameterId,
                  bookingParameterValueId: String(value.Id),
                }),
              }
            );

            if (res.ok) {
              const data = await res.json();

              const color = data?.[0]?.StaffColor ?? "#0b4db0";

              setStaffColors((prev) => ({
                ...prev,
                [String(value.Id)]: color,
              }));
            }
          }
        }
      } catch {
        // Silent fail
      }
    };

    if (isStaff) {
      loadColors();
    }

    return () => {
      isCancelled = true;
    };
  }, [valueIds, bookingSetupCode, bookingParameterId, isStaff]);

  // Load staff list for assignments
  useEffect(() => {
    if (!bookingSetupCode) return;
    fetch("/api/booking-branch-setup/get-booking-setup")
      .then((r) => r.json())
      .then((data) => {
        const staffParam = data?.[0]?.BookingParameter?.find(
          (p: any) =>
            String(p.BookingParameterCode || "").trim().toUpperCase() === "STAFF"
        );
        setStaffParameterId(String(staffParam?.BookingParameterId ?? ""));
        const list: StaffItem[] =
          staffParam?.BookingParameterValue?.map((v: any) => ({
            id: String(v.BookingParameterValueId),
            code: String(v.BookingParameterValueCode),
            description: String(v.BookingParameterValueDescription),
            price: String(v.BookingParameterValuePrice),
            sequence: String(v.BookingParameterValueServiceSequence),
          })) ?? [];
        setStaffList(list);
      })
      .catch(console.error);
  }, [bookingSetupCode]);

  const availableStaff = useMemo(() => {
    const assignedIds = new Set(
      staffAssignmentsList.map((staff) => String(staff.staffId).trim())
    );
    const assignedCodes = new Set(
      staffAssignmentsList.map((staff) =>
        String(staff.staffCode).trim().toUpperCase()
      )
    );

    return staffList.filter((staff) => {
      const normalizedId = String(staff.id).trim();
      const normalizedCode = String(staff.code).trim().toUpperCase();

      return !assignedIds.has(normalizedId) && !assignedCodes.has(normalizedCode);
    });
  }, [staffAssignmentsList, staffList]);

  const handleDelete = async (valueId: string) => {
    const itemType = isStaff ? "staff" : isService ? "service" : "room";
    if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;

    setDeletingId(valueId);
    try {
      const res = await fetch("/api/booking-parameter/delete-booking-parameter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(valueId),
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: `${itemType} deleted`, fill: "#171717" });
      await onRefresh();
    } catch {
      sileo.error({ title: `Failed to delete ${itemType}`, fill: "#171717" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDialog = (item?: BookingParameterValue) => {
    if (item) {
      setEditingId(item.Id);
      setCode(item.Code);
      setDescription(item.Description);
      setDuration(String(item.Duration || 0));
      setSequence((item.ServiceSequence || "0").toString());
      setPrice(
        String(
          item.ServicePrice ?? item.BookingParameterValueServicePrice ?? "0"
        )
      );
    } else {
      setEditingId(null);
      setCode("");
      setDescription("");
      setDuration("0");
      setSequence("0");
      setPrice("0");
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingId(null);
    setCode("");
    setDescription("");
    setDuration("0");
    setSequence("0");
    setPrice("0");
    setOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const itemType = isStaff ? "staff" : isService ? "service" : "room";
    const normalizedDuration = isService ? normalizeQuarterHour(duration) : "0";
    try {
      if (editingId) {
        const res = await fetch("/api/booking-parameter/update-booking-parameter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode,
            bookingParameterId,
            bookingParameterValueId: String(editingId),
            bookingParameterValueCode: code,
            bookingParameterValueDesc: description,
            bookingParameterValueDuration: normalizedDuration,
            bookingParameterValueStaff: isStaff ? "Yes" : "No",
            bookingParameterValueService: isService ? "Yes" : "No",
            bookingParameterValueServicePrice: isService ? price : "0",
            bookingParameterValueServiceSequence: isService ? sequence : "0",
          }),
        });
        if (!res.ok) throw new Error();
        sileo.success({ title: `${itemType} updated`, fill: "#171717" });
      } else {
        const res = await fetch("/api/booking-parameter/create-booking-parameter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode,
            bookingParameterId,
            bookingParameterValueCode: code,
            bookingParameterValueDesc: description,
            bookingParameterValueDuration: normalizedDuration,
            bookingParameterValueStaff: isStaff ? "Yes" : "No",
            bookingParameterValueService: isService ? "Yes" : "No",
            bookingParameterValueServicePrice: isService ? price : "0",
            bookingParameterValueServiceSequence: isService ? sequence : "0",
          }),
        });
        if (!res.ok) throw new Error();
        sileo.success({ title: `${itemType} created`, fill: "#171717" });
      }
      if (isService) {
        setDuration(normalizedDuration);
      }
      await onRefresh();
      handleCloseDialog();
    } catch {
      sileo.error({
        title: editingId
          ? `Failed to update ${itemType}`
          : `Failed to create ${itemType}`,
        fill: "#171717",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Staff color management
  const handleColorEdit = (valueId: string, currentColor: string) => {
    setColorEditingId(valueId);
    setColorEditingValue(currentColor || "#d1d5db");
    setColorDialogOpen(true);
  };

  const handleColorDialogClose = () => {
    setColorDialogOpen(false);
    setColorEditingId(null);
    setColorEditingValue("#d1d5db");
  };

  const updateStaffColor = async (valueId: string) => {
    setColorUpdating(true);
    try {
      const res = await fetch("/api/booking-staff-details/update-booking-staff-auth-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(valueId),
          staffColor: colorEditingValue,
        }),
      });
      if (!res.ok) throw new Error();
      setStaffColors((prev) => ({
        ...prev,
        [valueId]: colorEditingValue,
      }));
      sileo.success({ title: "Color updated", fill: "#171717" });
      handleColorDialogClose();
    } catch {
      sileo.error({ title: "Failed to update color", fill: "#171717" });
    } finally {
      setColorUpdating(false);
    }
  };

  // Staff email management
  const handleEmailEdit = async (valueId: string) => {
    setEmailEditingId(valueId);
    setEmailEditingValue("");
    setEmailLoading(true);
    setEmailDialogOpen(true);

    try {
      const res = await fetch(
        "/api/booking-staff-details/get-booking-staff-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingSetupCode,
            bookingParameterId,
            bookingParameterValueId: String(valueId),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEmailEditingValue(data?.[0]?.StaffEmail || "");
      }
    } catch {
      // Silent fail
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setEmailEditingId(null);
    setEmailEditingValue("");
    setEmailLoading(false);
  };

  const updateStaffEmail = async (valueId: string) => {
    setEmailUpdating(true);
    try {
      const res = await fetch("/api/booking-staff-details/update-booking-staff-auth-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(valueId),
          staffEmail: emailEditingValue,
        }),
      });
      if (!res.ok) throw new Error();
      setStaffEmails((prev) => ({
        ...prev,
        [valueId]: emailEditingValue,
      }));
      sileo.success({ title: "Email updated", fill: "#171717" });
      handleEmailDialogClose();
    } catch {
      sileo.error({ title: "Failed to update email", fill: "#171717" });
    } finally {
      setEmailUpdating(false);
    }
  };

  const resetTimeoffForm = () => {
    setTimeoffEditingIndex(null);
    setTimeoffDay("Monday");
    setTimeoffFromTime("12:00:00 AM");
    setTimeoffToTime("11:59:00 PM");
    setTimeoffWholeDay("No");
  };

  const loadStaffTimeoff = async (valueId: string) => {
    setTimeoffLoading(true);
    try {
      const res = await fetch("/api/booking-staff-timeoff/get-booking-staff-timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(valueId),
        }),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      setTimeoffList(Array.isArray(data) ? data : []);
    } catch {
      sileo.error({ title: "Failed to load staff time off", fill: "#171717" });
      setTimeoffList([]);
    } finally {
      setTimeoffLoading(false);
    }
  };

  const handleOpenTimeoffDialog = async (item: BookingParameterValue) => {
    setTimeoffStaffId(item.Id);
    setTimeoffStaffCode(item.Code);
    setTimeoffStaffName(item.Description || item.Code);
    resetTimeoffForm();
    setNewTimeoffDialogOpen(false);
    setTimeoffDialogOpen(true);
    await loadStaffTimeoff(item.Id);
  };

  const handleOpenNewTimeoffDialog = () => {
    resetTimeoffForm();
    setTimeoffEditingIndex(null);
    setNewTimeoffDialogOpen(true);
  };

  const handleEditTimeoff = (index: number) => {
    const entry = timeoffList[index];
    if (!entry) return;
    setTimeoffEditingIndex(index);
    setTimeoffDay(entry.Day || "Monday");
    setTimeoffFromTime(entry.FromTime || "12:00:00 AM");
    setTimeoffToTime(entry.ToTime || "11:59:00 PM");
    setTimeoffWholeDay(entry.WholeDay || "No");
  };

  const handleUpdateTimeoff = async () => {
    if (!timeoffStaffId || timeoffEditingIndex === null) return;
    setTimeoffSubmitting(true);
    try {
      const res = await fetch("/api/booking-staff-timeoff/update-booking-staff-timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(timeoffStaffId),
          staffCode: timeoffStaffCode,
          staffName: timeoffStaffName,
          day: timeoffDay,
          fromTime: timeoffFromTime,
          toTime: timeoffWholeDay === "Yes" ? "" : timeoffToTime,
          wholeDay: timeoffWholeDay,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Time off updated", fill: "#171717" });
      await loadStaffTimeoff(timeoffStaffId);
      setTimeoffEditingIndex(null);
      resetTimeoffForm();
    } catch {
      sileo.error({ title: "Failed to update time off", fill: "#171717" });
    } finally {
      setTimeoffSubmitting(false);
    }
  };

  const handleCreateTimeoff = async () => {
    if (!timeoffStaffId) return;
    setTimeoffSubmitting(true);
    try {
      const res = await fetch("/api/booking-staff-timeoff/create-booking-staff-timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(timeoffStaffId),
          staffCode: timeoffStaffCode,
          staffName: timeoffStaffName,
          day: timeoffDay,
          fromTime: timeoffFromTime,
          toTime: timeoffWholeDay === "Yes" ? "" : timeoffToTime,
          wholeDay: timeoffWholeDay,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Time off created", fill: "#171717" });
      await loadStaffTimeoff(timeoffStaffId);
      resetTimeoffForm();
      setNewTimeoffDialogOpen(false);
    } catch {
      sileo.error({ title: "Failed to create time off", fill: "#171717" });
    } finally {
      setTimeoffSubmitting(false);
    }
  };

  const handleCancelTimeoffEdit = () => {
    resetTimeoffForm();
    setTimeoffEditingIndex(null);
  };

  const handleDeleteTimeoff = async (entry: StaffTimeoffEntry) => {
    if (!timeoffStaffId) return;
    if (!confirm("Delete this time off entry?")) return;
    setTimeoffDeleting(true);
    try {
      const res = await fetch("/api/booking-staff-timeoff/delete-booking-staff-timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
          bookingParameterValueId: String(timeoffStaffId),
          day: entry.Day,
          fromTime: entry.FromTime,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Time off deleted", fill: "#171717" });
      await loadStaffTimeoff(timeoffStaffId);
    } catch {
      sileo.error({ title: "Failed to delete time off", fill: "#171717" });
    } finally {
      setTimeoffDeleting(false);
    }
  };

  const closeTimeoffDialog = () => {
    setTimeoffDialogOpen(false);
    setTimeoffStaffId(null);
    setTimeoffStaffCode("");
    setTimeoffStaffName("");
    setTimeoffList([]);
    resetTimeoffForm();
  };

const handleGetStaffAssignment = async (itemId: string, itemCode: string) => {
  try {
    setSelectedStaffId("");
    const res = await fetch("/api/booking-staff-rela/get-booking-staff-rela", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingSetupCode,
        serviceId: String(itemId),
      }),
    });

    if (!res.ok) throw new Error();

    const data = await res.json();

    const normalized = (data || []).map((row: any) => ({
      staffId: String(row.StaffId),
      staffCode: row.StaffCode,
      staffName: row.StaffName,
    }));

    setStaffAssignmentsList(normalized);
    setViewingItemId(itemId);
    setViewingItemCode(itemCode);
    setStaffAssignmentDialogOpen(true);
  } catch {
    sileo.error({ title: "Failed to load staff assignments", fill: "#171717" });
  }
};

  const handleDeleteStaffAssignment = async (staffId: string, serviceId: string) => {
    try {
      const res = await fetch("/api/booking-staff-rela/delete-booking-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          serviceId: String(serviceId),
          staffId: staffId,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Staff unassigned", fill: "#171717" });
      await handleGetStaffAssignment(serviceId, viewingItemCode);
    } catch {
      sileo.error({ title: "Failed to unassign staff", fill: "#171717" });
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !viewingItemId || !staffParameterId) return;

    setIsAssigning(true);
    try {
      const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
      if (!selectedStaff) throw new Error("Staff not found");

      const res = await fetch("/api/booking-staff-rela/create-staff-rela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId: staffParameterId,
          serviceId: String(viewingItemId),
          staffId: String(selectedStaff.id),
          staffCode: selectedStaff.code,
        }),
      });
      if (!res.ok) throw new Error();
      sileo.success({ title: "Staff assigned", fill: "#171717" });
      setSelectedStaffId("");
      await handleGetStaffAssignment(viewingItemId, viewingItemCode);
    } catch {
      sileo.error({ title: "Failed to assign staff", fill: "#171717" });
    } finally {
      setIsAssigning(false);
    }
  };

  // ---- Column definitions ----
  const isAdmin = auth?.user?.is_admin ?? false;

  const baseColumns: ColumnDef<BookingParameterValue>[] = [
    { accessorKey: "Code", header: "Code" },
    { accessorKey: "Description", header: "Name" },
  ];

  const sequenceColumn: ColumnDef<BookingParameterValue>[] = isService
    ? [{ accessorKey: "ServiceSequence", header: "Sequence" }]
    : [];

  const durationColumn: ColumnDef<BookingParameterValue>[] = isService
    ? [{ accessorKey: "Duration", header: "Duration (mins)" }]
    : [];

  const priceColumn: ColumnDef<BookingParameterValue>[] = isService
    ? [
        {
          accessorKey: "BookingParameterValueServicePrice",
          header: "Price (₱)",
          cell: ({ row }: any) => (
            <span>{row.original.BookingParameterValueServicePrice ?? row.original.ServicePrice ?? "0"}</span>
          ),
        },
      ]
    : [];

  const colorColumn: ColumnDef<BookingParameterValue>[] =
    isStaff && isAdmin
      ? [
        {
          id: "color",
          header: "Color",
          cell: ({ row }: any) => (
            <button
              onClick={() =>
                handleColorEdit(
                  row.original.Id,
                  staffColors[row.original.Id] || "#d1d5db"
                )
              }
              className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
              style={{
                backgroundColor: staffColors[row.original.Id] || "#d1d5db",
              }}
              title="Click to edit color"
            />
          ),
        },
      ]
      : [];

  const emailColumn: ColumnDef<BookingParameterValue>[] =
    isStaff && isAdmin
      ? [
        {
          id: "email",
          header: "Email",
          cell: ({ row }: any) => (
            <button
              onClick={() => handleEmailEdit(row.original.Id)}
              className="text-blue-600 hover:underline text-sm"
            >
              {staffEmails[row.original.Id] ? "Edit" : "Set"}
            </button>
          ),
        },
      ]
      : [];

  const staffManagementColumn: ColumnDef<BookingParameterValue>[] =
    isService && isAdmin
      ? [
        {
          id: "staff",
          header: "Staff",
          cell: ({ row }: any) => (
            <button
              onClick={() =>
                handleGetStaffAssignment(row.original.Id, row.original.Code)
              }
              className="text-blue-600 hover:underline text-sm"
            >
              Manage
            </button>
          ),
        },
      ]
      : [];

  const actionsColumn: ColumnDef<BookingParameterValue>[] = isAdmin
    ? [
      {
        id: "actions",
        header: "Action",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-2">
            {row.original.Staff && (
              <button
                onClick={() => handleOpenTimeoffDialog(row.original)}
                className="rounded-md bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Edit time off"
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => handleOpenDialog(row.original)}
              className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(row.original.Id)}
              disabled={deletingId === row.original.Id}
              className="rounded-md bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ]
    : [];

  const columns = useMemo(
    () => [
      ...baseColumns,
      ...sequenceColumn,
      ...durationColumn,
      ...priceColumn,
      ...colorColumn,
      ...emailColumn,
      ...staffManagementColumn,
      ...actionsColumn,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin, staffColors, staffEmails, isStaff, isService]
  );

  const itemType = isStaff ? "Staff" : isService ? "Service" : "Room";
  const itemTypeDesc = isStaff
    ? "Manage staff members"
    : isService
      ? "Manage service offerings"
      : "Manage available rooms";

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{itemType}s</h2>
            <p className="text-xs text-gray-400 mt-0.5">{itemTypeDesc}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add {itemType}
            </button>
          )}
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={values} />
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Edit ${itemType}` : `Add ${itemType}`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>{itemType} Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`e.g. ${itemType.toUpperCase()}001`}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`e.g. ${itemType} Name`}
              />
            </div>

            {isService && (
              <>
                <div className="grid gap-1.5">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    onBlur={() => setDuration(normalizeQuarterHour(duration))}
                    min="0"
                    step="15"
                    placeholder="e.g. 15, 30, 45"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>Sequence</Label>
                  <Input
                    type="number"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label>Price (₱)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 100.00"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={handleCloseDialog}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !code || !description}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Dialog — staff only */}
      {isStaff && (
        <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Color</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Select Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorEditingValue}
                    onChange={(e) => setColorEditingValue(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-600">
                    {colorEditingValue}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <button
                onClick={handleColorDialogClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => colorEditingId && updateStaffColor(colorEditingId)}
                disabled={colorUpdating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {colorUpdating ? "Saving..." : "Save"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Dialog — staff only */}
      {isStaff && (
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Email</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={emailEditingValue}
                  onChange={(e) => setEmailEditingValue(e.target.value)}
                  placeholder="e.g. staff@example.com"
                  disabled={emailLoading}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <button
                onClick={handleEmailDialogClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => emailEditingId && updateStaffEmail(emailEditingId)}
                disabled={emailUpdating || emailLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {emailUpdating ? "Saving..." : "Save"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Staff Time Off Dialog — staff only */}
      {isStaff && (
        <>
          <Dialog
            open={timeoffDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                closeTimeoffDialog();
                handleCancelTimeoffEdit();
              }
            }}
          >
            <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-6rem)] overflow-hidden">
              <DialogHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <DialogTitle>Time Off for {timeoffStaffName || timeoffStaffCode}</DialogTitle>
                    <p className="text-xs text-slate-500">
                      Review existing entries here. Click edit to update a row inline, or add a new entry.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewTimeoffDialog}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add time off
                  </button>
                </div>
              </DialogHeader>

              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Day</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">From</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">To</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wide">Whole day</th>
                      <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {timeoffLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                          Loading time off...
                        </td>
                      </tr>
                    ) : timeoffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                          No time off entries found. Use Add time off to create a new entry.
                        </td>
                      </tr>
                    ) : (
                      timeoffList.map((entry, index) => (
                        <tr
                          key={`${entry.Day}-${entry.FromTime}-${index}`}
                          className={timeoffEditingIndex === index ? "bg-slate-50" : ""}
                        >
                          <td className="px-4 py-3 align-top">
                            {timeoffEditingIndex === index ? (
                              <select
                                value={timeoffDay}
                                onChange={(e) => setTimeoffDay(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                {[
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday",
                                  "Sunday",
                                ].map((dayOption) => (
                                  <option key={dayOption} value={dayOption}>
                                    {dayOption}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-slate-900 font-medium">{entry.Day}</div>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top">
                            {timeoffEditingIndex === index ? (
                              <Input
                                value={timeoffFromTime}
                                onChange={(e) => setTimeoffFromTime(e.target.value)}
                                placeholder="12:00:00 AM"
                                disabled={timeoffWholeDay === "Yes"}
                                className="min-w-[140px]"
                              />
                            ) : (
                              <div className="text-slate-700">{entry.FromTime}</div>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top">
                            {timeoffEditingIndex === index ? (
                              <Input
                                value={timeoffToTime}
                                onChange={(e) => setTimeoffToTime(e.target.value)}
                                placeholder="04:00:00 PM"
                                disabled={timeoffWholeDay === "Yes"}
                                className="min-w-[140px]"
                              />
                            ) : (
                              <div className="text-slate-700">{entry.ToTime}</div>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top">
                            {timeoffEditingIndex === index ? (
                              <select
                                value={timeoffWholeDay}
                                onChange={(e) => setTimeoffWholeDay(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                              </select>
                            ) : (
                              <div className="text-slate-700">{entry.WholeDay}</div>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top text-right">
                            {timeoffEditingIndex === index ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleCancelTimeoffEdit}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdateTimeoff}
                                  disabled={timeoffSubmitting || (timeoffWholeDay === "No" && !timeoffFromTime)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {timeoffSubmitting ? "Saving..." : "Save"}
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setTimeoffEditingIndex(index);
                                    handleEditTimeoff(index);
                                  }}
                                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTimeoff(entry)}
                                  disabled={timeoffDeleting}
                                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              <DialogFooter>
                <button
                  onClick={() => {
                    closeTimeoffDialog();
                    handleCancelTimeoffEdit();
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={newTimeoffDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setNewTimeoffDialogOpen(false);
                resetTimeoffForm();
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add time off</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-1.5">
                  <Label>Day</Label>
                  <select
                    value={timeoffDay}
                    onChange={(e) => setTimeoffDay(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((dayOption) => (
                      <option key={dayOption} value={dayOption}>
                        {dayOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Whole Day</Label>
                  <select
                    value={timeoffWholeDay}
                    onChange={(e) => setTimeoffWholeDay(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>From Time</Label>
                    <Input
                      value={timeoffFromTime}
                      onChange={(e) => setTimeoffFromTime(e.target.value)}
                      placeholder="12:00:00 AM"
                      disabled={timeoffWholeDay === "Yes"}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>To Time</Label>
                    <Input
                      value={timeoffToTime}
                      onChange={(e) => setTimeoffToTime(e.target.value)}
                      placeholder="04:00:00 PM"
                      disabled={timeoffWholeDay === "Yes"}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <button
                  onClick={() => {
                    setNewTimeoffDialogOpen(false);
                    resetTimeoffForm();
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTimeoff}
                  disabled={timeoffSubmitting || !timeoffDay || (timeoffWholeDay === "No" && !timeoffFromTime)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {timeoffSubmitting ? "Saving..." : "Create"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Staff Assignment Dialog — service only */}
      {isService && (
        <Dialog
          open={staffAssignmentDialogOpen}
          onOpenChange={(open) => {
            setStaffAssignmentDialogOpen(open);
            if (!open) {
              setSelectedStaffId("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Staff for {viewingItemCode}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Assigned Staff</Label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {staffAssignmentsList.length > 0 ? (
                    staffAssignmentsList.map((staff) => (
                      <div
                        key={staff.staffId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {staff.staffCode} - {staff.staffName}
                        </span>
                        <button
                          onClick={() =>
                            handleDeleteStaffAssignment(staff.staffId, viewingItemId!)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No staff assigned</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Add Staff</Label>
                <div className="flex gap-2">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Select staff...</option>
                    {availableStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.code} - {staff.description}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignStaff}
                    disabled={!selectedStaffId || isAssigning || !staffParameterId}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isAssigning ? "..." : "Add"}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setStaffAssignmentDialogOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function BookingParameterPage() {
  const params = useParams();
  const bookingParameterId = params.id as string;

  const [values, setValues] = useState<BookingParameterValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSetupCode, setBookingSetupCode] = useState("MAIN");
  const [auth, setAuth] = useState<Auth | null>(null);
  const [parameterCode, setParameterCode] = useState("");

  // Fetch auth on mount
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          // data = { user: { booking_setup_code, is_admin, ... } }
          setAuth(data);
          if (data?.user?.booking_setup_code) {
            setBookingSetupCode(data.user.booking_setup_code);
          }
        }
      } catch {
        // Silent fail — auth stays null, admin features hidden
      }
    };

    fetchAuth();
  }, []);

  const fetchParameterValues = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/booking-parameter/get-booking-parameter-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSetupCode,
          bookingParameterId,
        }),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      const normalizedData: BookingParameterValue[] = Array.isArray(data) ? data : [];
      const sortedData =
        normalizedData.length > 0 && normalizedData.some((item) => item.Service)
          ? sortByServiceSequence(normalizedData)
          : normalizedData;

      setValues(sortedData);
      setParameterCode(
        sortedData[0]?.Staff ? "Staff" : sortedData[0]?.Service ? "Services" : "Rooms"
      );
    } catch {
      sileo.error({ title: "Failed to load booking parameters", fill: "#171717" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameterValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingParameterId, bookingSetupCode]);

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{parameterCode}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-8 min-h-[calc(100vh-4rem)] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-gray-400">Loading...</div>
          </div>
        ) : (
          <BookingParameterContent
            values={values}
            bookingSetupCode={bookingSetupCode}
            bookingParameterId={bookingParameterId}
            parameterCode={parameterCode}
            auth={auth}
            onRefresh={fetchParameterValues}
          />
        )}
      </div>
    </>
  );
}
