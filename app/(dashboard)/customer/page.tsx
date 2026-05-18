"use client";

import { useEffect, useState } from "react";
import { Eye, User } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CustomerData } from "@/types/bc-types";

export default function Page() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customer/get-customers");
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns: ColumnDef<CustomerData>[] = [
    {
      accessorKey: "CustomerNo",
      header: "Customer Number",
    },
    {
      accessorKey: "Name",
      header: "Name",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button onClick={() => setSelectedCustomer(row.original)} className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200">
          <Eye className="h-4 w-4" />View
        </button>
      ),
    },
  ];

  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Customer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Customers</h2>
            </div>
            <DataTable columns={columns} data={customers} />
          </div>
        </div>
        {selectedCustomer && (
          <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null) }>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {selectedCustomer.Name}
                </DialogTitle>

                <DialogDescription>
                  View customer details
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Customer No"
                  value={selectedCustomer.CustomerNo}
                />

                <InputField
                  label="Name"
                  value={selectedCustomer.Name}
                />

                <InputField
                  label="Phone No"
                  value={selectedCustomer.PhoneNo}
                />

                <InputField
                  label="Email"
                  value={selectedCustomer.EMail}
                />

                <InputField
                  label="Age"
                  value={selectedCustomer.Age}
                />

                <InputField
                  label="Birth Date"
                  value={selectedCustomer.BirthDate}
                />
              </div>

              <div className="space-y-4">
                <TextAreaField
                  label="Address"
                  value={selectedCustomer.Address}
                />

                <TextAreaField
                  label="Address 2"
                  value={selectedCustomer.Address2}
                />
              </div>

              <DialogFooter>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg border px-4 py-2"
                >
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    </>

  );
}

function InputField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type="text"
        value={value || ""}
        disabled
        className="w-full rounded-lg border bg-gray-50 px-3 py-2"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <textarea
        value={value || ""}
        disabled
        rows={3}
        className="w-full resize-none rounded-lg border bg-gray-50 px-3 py-2"
      />
    </div>
  );
}