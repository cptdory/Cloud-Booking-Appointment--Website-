"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Customer } from "@/types/customer";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/customer/get-customers");

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const data = await response.json();

      if (data.value && Array.isArray(data.value)) {
        setCustomers(data.value);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Combine address fields for display in textarea
  const getCombinedAddress = (customer: Customer) => {
    const addressParts = [];
    if (customer.Address) addressParts.push(customer.Address);
    if (customer.Address2) addressParts.push(customer.Address2);
    return addressParts.join("\n");
  };

  if (loading) {
    return (
<div className="flex flex-1 flex-col p-4 md:p-6 lg:pl-10">

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Loading customers...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
<div className="flex flex-1 flex-col p-4 md:p-6 lg:pl-10">

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={fetchCustomers}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                {customers.length} customer{customers.length !== 1 ? "s" : ""}{" "}
                found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Customer No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Phone
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {error
                            ? "Failed to load customers"
                            : "No customers found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow
                          key={customer.CustomerNo}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleCustomerClick(customer)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-muted-foreground" />
                              {customer.CustomerNo}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.Name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.PhoneNo || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {customer.EMail || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerClick(customer);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </DialogTitle>
                <DialogDescription>
                  Complete information for {selectedCustomer?.Name}
                </DialogDescription>
              </DialogHeader>

              {selectedCustomer && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            Customer Number
                          </label>
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono">
                              {selectedCustomer.CustomerNo}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            Age
                          </label>
                          <p>{selectedCustomer.Age || "N/A"}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">
                          Primary Name
                        </label>
                        <p className="font-medium">{selectedCustomer.Name}</p>
                      </div>

                      {selectedCustomer.Name2 && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            Secondary Name
                          </label>
                          <p>{selectedCustomer.Name2}</p>
                        </div>
                      )}

                      {selectedCustomer.BirthDate && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            Birth Date
                          </label>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {formatDate(selectedCustomer.BirthDate)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <p>{selectedCustomer.PhoneNo || "N/A"}</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </label>
                          <p>{selectedCustomer.EMail || "N/A"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">
                          Complete Address
                        </label>
                        <Textarea
                          value={getCombinedAddress(selectedCustomer)}
                          readOnly
                          className="min-h-[100px] resize-none bg-muted/50 font-mono text-sm"
                          placeholder="No address information available"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {selectedCustomer.Address &&
                            selectedCustomer.Address2
                              ? "Includes both Address and Address2 fields"
                              : selectedCustomer.Address
                              ? "From Address field only"
                              : selectedCustomer.Address2
                              ? "From Address2 field only"
                              : "No address data"}
                          </span>
                          <span>
                            {getCombinedAddress(selectedCustomer).length > 0
                              ? `${
                                  getCombinedAddress(selectedCustomer).split(
                                    "\n"
                                  ).length
                                } line(s)`
                              : ""}
                          </span>
                        </div>
                      </div>

                      {/* Individual address fields for reference */}
                      {(selectedCustomer.Address ||
                        selectedCustomer.Address2) && (
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-medium mb-3">
                            Individual Address Fields
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <label className="text-muted-foreground block mb-1">
                                Address:
                              </label>
                              <div className="bg-muted/30 p-2 rounded border">
                                {selectedCustomer.Address || "Empty"}
                              </div>
                            </div>
                            <div>
                              <label className="text-muted-foreground block mb-1">
                                Address 2:
                              </label>
                              <div className="bg-muted/30 p-2 rounded border">
                                {selectedCustomer.Address2 || "Empty"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="px-4 py-2">
                      Active Customer
                    </Badge>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
