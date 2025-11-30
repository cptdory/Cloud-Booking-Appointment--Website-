"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";

import { useBookingParams } from "@/hooks/useBookingParams";
import { useParameterCRUD } from "@/hooks/useParameterCRUD";

export default function ParameterPage() {
  // URL Params
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams("");
  const code = search.get("code") || "";
  const parameterId = search.get("parameter_id") || "";

  const {
    values,
    loading,
    error,
    parameterName,
    isParamStaff,
    isParamService,
    checkDuration,
    loadValues,
  } = useBookingParams(code, parameterId);

  // Name used in success messages
  const getItemType = () => {
    if (isParamService === "true") return "service";
    if (isParamStaff === "true") return "staff";
    return "item";
  };

  const crud = useParameterCRUD({
    code,
    parameterId,
    isParamStaff,
    isParamService,
    loadValues,
    getItemType,
  });

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      {/* SUCCESS */}
      {crud.success && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{crud.success}</AlertDescription>
        </Alert>
      )}

      {/* MAIN CARD */}
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{parameterName}</CardTitle>

          <Button onClick={() => crud.setCreating(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> New {getItemType()}
          </Button>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    {checkDuration === "true" && <TableHead>Duration</TableHead>}
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {values.map((v) => (
                    <TableRow key={v.BookingParameterValueId}>
                      <TableCell>{v.BookingParameterValueId}</TableCell>
                      <TableCell>{v.BookingParameterValueCode}</TableCell>
                      <TableCell>{v.BookingParamterValueDescription}</TableCell>
                      {checkDuration === "true" && (
                        <TableCell>{v.BookingParameterValueDuration}</TableCell>
                      )}

                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => crud.openEdit(v)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => crud.setDeleteItem(v)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT, CREATE, DELETE dialogs remain same — now extremely clean */}
    </div>
  );
}
