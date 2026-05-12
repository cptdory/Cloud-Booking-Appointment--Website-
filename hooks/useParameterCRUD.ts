"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useModalAlert } from "@/hooks/useAlert";

export function useParameterCRUD({
  code,
  parameterId,
  isParamStaff,
  isParamService,
  loadValues,
  getItemType,
}: any) {
  const { showSuccess } = useToast();
  const { showError: showErrorAlert } = useModalAlert();

  // Edit
  const [editing, setEditing] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Create
  const [creating, setCreating] = useState(false);
  const [creatingSaving, setCreatingSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    BookingParameterValueCode: "",
    BookingParamterValueDescription: "",
    BookingParameterValueDuration: 60,
    BookingParameterValueServiceSequence: 0,
  });

  // Delete
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // OPEN EDIT
  const openEdit = (item: any) => {
    setEditItem({
      BookingParameterValueId: item.BookingParameterValueId,
      BookingParameterValueCode: item.BookingParameterValueCode,
      BookingParamterValueDescription: item.BookingParamterValueDescription,
      BookingParameterValueDuration: item.BookingParameterValueDuration,
      BookingParameterValueServiceSequence:
        item.BookingParameterValueServiceSequence ?? 0,
    });
    setEditing(true);
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: String(editItem.BookingParameterValueId),
        _BookingParameterValueCode: editItem.BookingParameterValueCode,
        _BookingParamenterValueDesc: editItem.BookingParamterValueDescription,
        _BookingParameterValueDuration: String(
          editItem.BookingParameterValueDuration
        ),
        _BookingParameterValueStaff: isParamStaff,
        _BookingParameterValueService: isParamService,
        _BookingParameterValueServiceSequence: String(
          editItem.BookingParameterValueServiceSequence ?? 0
        ),
      };

      const res = await fetch(
        "/api/booking-parameter/update-booking-parameter-value",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");

      await loadValues();
      setEditing(false);
      setEditItem(null);

      showSuccess(`${getItemType()} updated successfully!`);
    } catch (err: any) {
      showErrorAlert(err.message, "Update Failed");
    } finally {
      setSaving(false);
    }
  };

  // CREATE
  const handleCreate = async () => {
    setCreatingSaving(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueCode: newItem.BookingParameterValueCode,
        _BookingParameterValueDesc: newItem.BookingParamterValueDescription,
        _BookingParameterValueDuration: String(
          newItem.BookingParameterValueDuration
        ),
        _BookingParameterValueStaff: isParamStaff,
        _BookingParameterValueService: isParamService,
        _BookingParameterValueServiceSequence: String(
          newItem.BookingParameterValueServiceSequence ?? 0
        ),
      };

      const res = await fetch(
        "/api/booking-parameter/create-booking-parameter-value",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Create failed");

      await loadValues();
      setCreating(false);
      setNewItem({
        BookingParameterValueCode: "",
        BookingParamterValueDescription: "",
        BookingParameterValueDuration: 60,
        BookingParameterValueServiceSequence: 0,
      });

      showSuccess(`${getItemType()} created successfully!`);
    } catch (err: any) {
      showErrorAlert(err.message, "Create Failed");
    } finally {
      setCreatingSaving(false);
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);

    try {
      const body = {
        _BookingSetupCode: code,
        _BookingParameterId: parameterId,
        _BookingParameterValueId: deleteItem.BookingParameterValueId,
      };

      const res = await fetch(
        "/api/booking-parameter/delete-booking-parameter-value",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");

      await loadValues();
      setDeleteItem(null);

      showSuccess(`${getItemType()} deleted successfully!`);
    } catch (err: any) {
      showErrorAlert(err.message, "Delete Failed");
    } finally {
      setDeleting(false);
    }
  };

  return {
    // EDIT
    editing,
    editItem,
    saving,
    openEdit,
    setEditing,
    setEditItem,
    handleUpdate,

    // CREATE
    creating,
    creatingSaving,
    newItem,
    setNewItem,
    setCreating,
    handleCreate,

    // DELETE
    deleteItem,
    deleting,
    setDeleteItem,
    handleDelete,
  };
}
