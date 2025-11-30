// page.tsx (refactored)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Loader2,
  Calendar,
  FileText,
  Users,
  Briefcase,
  CheckCircle2,
  User,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, XCircle } from "lucide-react";
import { Branch } from "@/types/branch";
import { BookingSetup } from "@/types/bookingSetup";
import { BookingParameter } from "@/types/bookingParameter";
import { StaffAssignment } from "@/types/staffAssignment";

// Import hooks
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useBranches";
import { useBookingSetup } from "@/hooks/useBookingSetup";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useCustomers } from "@/hooks/useCustomers";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useAlert } from "@/hooks/useAlert";
import { useBookingParams } from "@/hooks/useBookingParams";

interface FormData {
  branch: string;
  service: string;
  staff: string;
  [key: string]: string;
  date: string;
  selectedTime: string;
  customerNo: string;
  bookingNote: string;
}

interface BookingSummary {
  branch: Branch | null;
  service: {
    id: string;
    name: string;
    duration: number;
    code: string;
  } | null;
  staff: {
    id: string;
    name: string;
    code: string;
  } | null;
  dynamicParameters: {
    parameterName: string;
    valueName: string;
  }[];
  date: string;
  time: string;
  customer: {
    customerNo: string;
    name: string;
  } | null;
}

export default function BookingForm() {
  const router = useRouter();
  
  // Use hooks
  const { userRole, username, customerNo, checkingAuth } = useAuth();
  const { branches, loading: branchesLoading, fetchBranches } = useBranches();
  const { bookingSetup, loading: setupLoading, fetchBookingSetup } = useBookingSetup();
  const { staffAssignments, loading: staffLoading, fetchStaffAssignments } = useStaffAssignments();
  const { customers, loading: customersLoading } = useCustomers(userRole);
  const { availableTimeSlots, loading: timeSlotsLoading, fetchAvailableTimeSlots } = useTimeSlots();
  const { alert, showAlert } = useAlert();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    branch: "",
    service: "",
    staff: "",
    date: "",
    selectedTime: "",
    customerNo: "",
    bookingNote: "",
  });

  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    branch: null,
    service: null,
    staff: null,
    dynamicParameters: [],
    date: "",
    time: "",
    customer: null,
  });

  const [submitting, setSubmitting] = useState(false);

  // Use booking params hook for dynamic parameters
  const dynamicParametersData = useBookingParams(formData.branch, "dynamic-param-id");

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches().catch((error) => {
      showAlert(
        "Failed to Load Branches",
        error.message || "Please try again later.",
        "destructive"
      );
    });
  }, []);

  // Update booking summary when form data changes
  useEffect(() => {
    const updateBookingSummary = () => {
      const summary: BookingSummary = {
        branch: branches.find(b => b.Code === formData.branch) || null,
        service: null,
        staff: null,
        dynamicParameters: [],
        date: formData.date,
        time: formData.selectedTime,
        customer: customers.find(c => c.customerNo === formData.customerNo) || 
                 (userRole !== "admin" && userRole !== "global-admin" && customerNo ? 
                  { customerNo, name: username || "Customer" } : null),
      };

      // Set service info
      if (bookingSetup && formData.service) {
        const services = getServices();
        const selectedService = services.find(
          s => s.BookingParameterValueId.toString() === formData.service
        );
        if (selectedService) {
          summary.service = {
            id: selectedService.BookingParameterValueId.toString(),
            name: selectedService.BookingParamterValueDescription,
            duration: selectedService.BookingParameterValueDuration,
            code: selectedService.BookingParameterValueCode,
          };
        }
      }

      // Set staff info
      if (formData.staff) {
        const selectedStaff = staffAssignments.find(
          s => s.StaffId.toString() === formData.staff
        );
        if (selectedStaff) {
          summary.staff = {
            id: selectedStaff.StaffId.toString(),
            name: selectedStaff.StaffName,
            code: selectedStaff.StaffCode,
          };
        }
      }

      // Set dynamic parameters info
      const dynamicParams = getDynamicParameters();
      dynamicParams.forEach(param => {
        const valueId = formData[param.BookingParameterId.toString()];
        if (valueId) {
          const selectedValue = param.BookingParameterValue.find(
            v => v.BookingParameterValueId.toString() === valueId
          );
          if (selectedValue) {
            summary.dynamicParameters.push({
              parameterName: param.BookingParameterCode,
              valueName: selectedValue.BookingParamterValueDescription,
            });
          }
        }
      });

      setBookingSummary(summary);
    };

    updateBookingSummary();
  }, [formData, branches, bookingSetup, staffAssignments, customers, userRole, customerNo, username]);

  const handleStepSelection = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleInputChange = async (field: keyof FormData, value: string): Promise<void> => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-advance steps based on selection with correct sequence
    if (field === "branch" && value) {
      try {
        await fetchBookingSetup(value);
        setCurrentStep(2);
      } catch (error: any) {
        showAlert(
          "Failed to Load Branch Details",
          error.message || "Please try selecting a different branch or try again later.",
          "destructive"
        );
      }
    } else if (field === "service" && value && currentStep === 2) {
      // Reset staff and dynamic parameters when service changes
      setFormData((prev) => {
        const updated: FormData = {
          ...prev,
          staff: "",
          service: value,
        };

        // Reset dynamic parameters
        const dynamicParameters = getDynamicParameters();
        dynamicParameters.forEach((param) => {
          const paramId = param.BookingParameterId.toString();
          updated[paramId] = "";
        });

        return updated;
      });

      try {
        await fetchStaffAssignments(formData.branch, value);
        setCurrentStep(3);
      } catch (error: any) {
        showAlert(
          "Failed to Load Staff Assignments",
          error.message || "Please try selecting a different service.",
          "destructive"
        );
      }
    } else if (currentStep === 3) {
      // Check if this is a dynamic parameter field
      const dynamicParameters = getDynamicParameters();
      const isDynamicField = dynamicParameters.some(
        (param) => param.BookingParameterId.toString() === field
      );

      if (isDynamicField) {
        // Check if all dynamic parameters are filled to auto-advance
        const allDynamicSelected = dynamicParameters.every((param) => {
          const paramId = param.BookingParameterId.toString();
          return paramId === field
            ? value
            : formData[paramId as keyof FormData];
        });

        if (allDynamicSelected) {
          setCurrentStep(4);
        }
      }
    } else if (field === "selectedTime" && value && currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleDynamicParameterChange = (
    parameterId: number,
    value: string
  ): void => {
    handleInputChange(parameterId.toString() as keyof FormData, value);
  };

  const handleTimeSlotClick = (time: string): void => {
    const formatTime = (time: string): string => {
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let [_, hours, minutes, period] = timeMatch;
        const formattedHours = hours.padStart(2, "0");
        return `${formattedHours}:${minutes} ${period.toUpperCase()}`;
      }
      return time;
    };

    const formattedTime = formatTime(time);

    setFormData((prev) => ({
      ...prev,
      selectedTime: formattedTime,
    }));

    setCurrentStep(5);
  };

  // Fetch time slots when all prerequisites are met
  useEffect(() => {
    if (currentStep >= 4 && formData.date && formData.branch && formData.service && formData.staff) {
      const dynamicParameters = getDynamicParameters();
      const allDynamicSelected = dynamicParameters.every(
        (param) => formData[param.BookingParameterId.toString()]
      );

      if (allDynamicSelected) {
        const dynamicParamsData = dynamicParameters.map((param) => ({
          id: param.BookingParameterId.toString(),
          value: formData[param.BookingParameterId.toString()] || "",
        }));

        fetchAvailableTimeSlots(
          formData.branch,
          formData.date,
          formData.service,
          formData.staff,
          dynamicParamsData
        ).catch((error) => {
          showAlert(
            "Failed to Load Time Slots",
            error.message || "Please try selecting a different date or time.",
            "destructive"
          );
        });
      }
    }
  }, [formData.date, currentStep]);

  // Get services from booking setup
  const getServices = () => {
    return (
      bookingSetup?.BookingParameter?.find(
        (param) => param.BookingParameterService
      )?.BookingParameterValue || []
    );
  };

  // Get dynamic parameters (all parameters except service and staff)
  const getDynamicParameters = (): BookingParameter[] => {
    if (!bookingSetup?.BookingParameter) return [];

    return bookingSetup.BookingParameter.filter(
      (param) => !param.BookingParameterService && !param.BookingParameterStaff
    ).sort((a, b) => a.BookingParameterSequence - b.BookingParameterSequence);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    const dynamicParameters = getDynamicParameters();
    const allDynamicSelected = dynamicParameters.every(
      (param) => formData[param.BookingParameterId.toString()]
    );

    if (
      !formData.branch ||
      !formData.service ||
      !formData.staff ||
      !allDynamicSelected ||
      !formData.date ||
      !formData.selectedTime ||
      !formData.customerNo
    ) {
      showAlert(
        "Missing Information",
        "Please fill in all required fields before submitting.",
        "destructive"
      );
      return;
    }

    setSubmitting(true);

    try {
      const parameterIds = [
        "1",
        "2",
        ...dynamicParameters.map((p) => p.BookingParameterId.toString()),
      ].join("|");
      
      const parameterValues = [
        formData.service,
        formData.staff,
        ...dynamicParameters.map(
          (p) => formData[p.BookingParameterId.toString()] || ""
        ),
      ].join("|");

      const response = await fetch(
        "/api/available-timeslot/book-available-timeslot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: formData.branch,
            _BookingDate: formData.date,
            _BookingStartTime: formData.selectedTime,
            _BookingParameterCount: (2 + dynamicParameters.length).toString(),
            _BookingParameterIDs: parameterIds,
            _BookingParameterValueIDs: parameterValues,
            _CustomerNo: formData.customerNo,
            _BookingNote: formData.bookingNote || "-",
            _BookingEntryNo: ""
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create booking");
      await response.json();

      showAlert("Booking Confirmed!", "Your appointment has been successfully scheduled.");

      // Reset form
      const resetData: FormData = {
        branch: "",
        service: "",
        staff: "",
        date: "",
        selectedTime: "",
        customerNo: userRole === "admin" ? "" : customerNo,
        bookingNote: "",
      };

      dynamicParameters.forEach((param) => {
        resetData[param.BookingParameterId.toString()] = "";
      });

      setFormData(resetData);
      setCurrentStep(1);
      setBookingSummary({
        branch: null,
        service: null,
        staff: null,
        dynamicParameters: [],
        date: "",
        time: "",
        customer: null,
      });
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      showAlert(
        "Booking Failed",
        "Failed to create booking. Please try again.",
        "destructive"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Set customer number for non-admin users and auto-advance
  useEffect(() => {
    if (customerNo && userRole !== "admin" && currentStep >= 5) {
      setFormData((prev) => ({
        ...prev,
        customerNo: customerNo,
      }));
    }
  }, [customerNo, userRole, currentStep]);

  // Booking Summary Component (keep the same as before)
  const BookingSummaryCard = () => {
    const hasSummary = bookingSummary.branch || bookingSummary.service || bookingSummary.staff || bookingSummary.date;
    
    if (!hasSummary) return null;

    return (
      <Card className=" border-blue-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className=" flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingSummary.branch && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Branch:</span>
              <span className=" text-right">
                {bookingSummary.branch.Description}
                <br />
                <span className="text-sm text-blue-600">{bookingSummary.branch.Location}</span>
              </span>
            </div>
          )}
          
          {bookingSummary.service && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Service:</span>
              <span className=" text-right">
                {bookingSummary.service.name}
                <br />
                <span className="text-sm text-blue-600">
                  {bookingSummary.service.duration} mins
                </span>
              </span>
            </div>
          )}
          
          {bookingSummary.staff && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Staff:</span>
              <span className=" text-right">
                {bookingSummary.staff.name}
              </span>
            </div>
          )}
          
          {bookingSummary.dynamicParameters.length > 0 && (
            <div>
              <div className="space-y-1">
                {bookingSummary.dynamicParameters.map((param, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-blue-700 font-medium">{param.parameterName}:</span>
                    <span className=" text-sm">{param.valueName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {bookingSummary.date && (
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Date:</span>
              <span className="">
                {new Date(bookingSummary.date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {bookingSummary.time && (
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Time:</span>
              <span className="">{bookingSummary.time}</span>
            </div>
          )}
          
          {bookingSummary.customer && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Customer:</span>
              <span className=" text-right">
                {bookingSummary.customer.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="container mx-auto p-6 max-w-6xl flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-muted-foreground">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Alert Component */}
      {alert.show && (
        <Alert
          variant={alert.variant}
          className="mb-6 animate-in slide-in-from-top duration-300"
        >
          {alert.variant === "destructive" && <XCircle className="h-4 w-4" />}
          {alert.variant === "default" && <Info className="h-4 w-4" />}

          <AlertDescription className="flex flex-col">
            <span className="font-semibold">{alert.title}</span>
            <span>{alert.description}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* User Info Banner */}
      <Card className=" border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold ">
                  Welcome, {username || "User"}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Badge
                    variant={userRole === "admin" ? "default" : "secondary"}
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {userRole === "admin" ? "Administrator" : "Customer"}
                  </Badge>
                  {userRole !== "admin" && customerNo && (
                    <span>ID: {customerNo}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          {/* Numbers + Chevrons */}
          <div className="grid grid-cols-5 gap-0">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <button
                  onClick={() => handleStepSelection(step)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full
                    ${
                      currentStep >= step
                        ? "bg-blue-600 text-white cursor-pointer"
                        : "bg-blue-100 text-blue-400 cursor-default"
                    }
                    ${step < currentStep ? "hover:bg-blue-700" : ""}
                  `}
                >
                  {step}
                </button>

                {/* Chevron Below Circle (except last) */}
                {step < 5 && (
                  <ChevronRight
                    className={`w-4 h-4 mt-1 ${
                      currentStep > step ? "text-blue-600" : "text-blue-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="grid grid-cols-5 mt-3 text-xs text-blue-700 text-center">
            <span>Branch</span>
            <span>Service</span>
            <span>Staff & Options</span>
            <span>Date & Time</span>
            <span>Customer</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation Buttons */}
      {currentStep > 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => handleStepSelection(currentStep - 1)}
            disabled={submitting}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </Button>
          <div className="text-sm text-blue-600">
            Step {currentStep} of 5
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Branch Selection */}
          {currentStep === 1 && (
            <Card className="border-blue-200">
              <CardHeader className=" border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <CardTitle className="">Step 1: Choose Your Branch</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {branchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
                    <span className="text-blue-700">
                      Loading branches...
                    </span>
                  </div>
                ) : branches.length === 0 ? (
                  <p className="text-center text-blue-600 py-8">
                    No branches available
                  </p>
                ) : (
                  <RadioGroup
                    value={formData.branch}
                    onValueChange={(value) => handleInputChange("branch", value)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {branches.map((branch) => (
                        <Label
                          key={branch.Code}
                          htmlFor={`branch-${branch.Code}`}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.branch === branch.Code
                              ? "border-blue-600"
                              : "border-blue-200 hover:border-blue-400"
                          }`}
                        >
                          <RadioGroupItem
                            value={branch.Code}
                            id={`branch-${branch.Code}`}
                            className="text-blue-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-semibold ">
                              {branch.Description}
                            </div>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Service Selection */}
          {currentStep === 2 && (
            <Card className="border-blue-200">
              <CardHeader className=" border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <CardTitle className="">Step 2: Select Service</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {setupLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
                    <span className="text-blue-700">
                      Loading services...
                    </span>
                  </div>
                ) : getServices().length === 0 ? (
                  <p className="text-blue-600">No services available</p>
                ) : (
                  <RadioGroup
                    value={formData.service}
                    onValueChange={(value) => handleInputChange("service", value)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getServices().map((service) => (
                        <Label
                          key={service.BookingParameterValueId}
                          htmlFor={`service-${service.BookingParameterValueId}`}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.service ===
                            service.BookingParameterValueId.toString()
                              ? "border-blue-600"
                              : "border-blue-200 hover:border-blue-400"
                          }`}
                        >
                          <RadioGroupItem
                            value={service.BookingParameterValueId.toString()}
                            id={`service-${service.BookingParameterValueId}`}
                            className="text-blue-600"
                          />
                          <div className="ml-3">
                            <div className="font-medium ">
                              {service.BookingParamterValueDescription}
                            </div>
                            <div className="text-sm text-blue-600">
                              {service.BookingParameterValueDuration} mins
                            </div>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Staff & Dynamic Parameters Selection */}
          {currentStep === 3 && (
            <Card className="border-blue-200">
              <CardHeader className="border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle className="">Step 3: Select Staff & Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Staff Selection */}
                <div>
                  <h3 className="text-lg font-medium mb-4 ">Select Staff</h3>
                  {staffLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
                      <span className="text-blue-700">
                        Loading staff...
                      </span>
                    </div>
                  ) : staffAssignments.length === 0 ? (
                    <p className="text-blue-600">
                      No staff available for this service
                    </p>
                  ) : (
                    <RadioGroup
                      value={formData.staff}
                      onValueChange={(value) => handleInputChange("staff", value)}
                    >
                      <div className="space-y-2">
                        {staffAssignments.map((staff) => (
                          <Label
                            key={staff.StaffId}
                            htmlFor={`staff-${staff.StaffId}`}
                            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              formData.staff === staff.StaffId.toString()
                                ? "border-blue-600"
                                : "border-blue-200 hover:border-blue-400"
                            }`}
                          >
                            <RadioGroupItem
                              value={staff.StaffId.toString()}
                              id={`staff-${staff.StaffId}`}
                              className="text-blue-600"
                            />
                            <div className="ml-3">
                              <div className="font-medium ">{staff.StaffName}</div>
                            </div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>

                {/* Dynamic Parameters */}
                {formData.staff && getDynamicParameters().length > 0 && (
                  <>
                    <Separator className="bg-blue-200" />
                    <div>
                      <h3 className="text-lg font-medium mb-4 ">
                        Additional Options
                      </h3>
                      <div className="space-y-6">
                        {getDynamicParameters().map((parameter) => (
                          <div key={parameter.BookingParameterId}>
                            <h4 className="font-medium mb-3 text-blue-800">
                              {parameter.BookingParameterCode}
                            </h4>
                            <RadioGroup
                              value={
                                formData[parameter.BookingParameterId.toString()]
                              }
                              onValueChange={(value) =>
                                handleDynamicParameterChange(
                                  parameter.BookingParameterId,
                                  value
                                )
                              }
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {parameter.BookingParameterValue.map((value) => (
                                  <Label
                                    key={value.BookingParameterValueId}
                                    htmlFor={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`}
                                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                      formData[
                                        parameter.BookingParameterId.toString()
                                      ] === value.BookingParameterValueId.toString()
                                        ? "border-blue-600"
                                        : "border-blue-200 hover:border-blue-400"
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={value.BookingParameterValueId.toString()}
                                      id={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`}
                                      className="text-blue-600"
                                    />
                                    <div className="ml-3">
                                      <div className="font-medium ">
                                        {value.BookingParamterValueDescription}
                                      </div>
                                    </div>
                                  </Label>
                                ))}
                              </div>
                            </RadioGroup>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Date & Time Selection */}
          {currentStep === 4 && (
            <Card className="border-blue-200">
              <CardHeader className="border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle className="">Step 4: Select Date & Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date Selection - Left Side */}
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="booking-date"
                        className="text-base font-medium mb-2 block "
                      >
                        Select Date
                      </Label>
                      <Input
                        id="booking-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      {formData.date && (
                        <p className="text-sm text-blue-600 mt-2">
                          Selected date:{" "}
                          {new Date(formData.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Quick Stats */}
                    {formData.date && availableTimeSlots.length > 0 && (
                      <Card className=" border-blue-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-2xl font-bold ">
                                {availableTimeSlots.length}
                              </div>
                              <div className="text-xs text-blue-600">
                                Total
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {
                                  availableTimeSlots.filter(
                                    (slot) => slot.available
                                  ).length
                                }
                              </div>
                              <div className="text-xs text-blue-600">
                                Available
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">
                                {
                                  availableTimeSlots.filter(
                                    (slot) => !slot.available
                                  ).length
                                }
                              </div>
                              <div className="text-xs text-blue-600">
                                Booked
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Time Slot Selection - Right Side */}
                  {formData.date && (
                    <div className="space-y-4">
                      <Label className="text-base font-medium block ">
                        Available Time Slots
                      </Label>

                      {timeSlotsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
                          <span className="text-blue-700">
                            Loading available time slots...
                          </span>
                        </div>
                      ) : availableTimeSlots.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
                            {availableTimeSlots.map((slot, index) => (
                              <Button
                                key={`${slot.id}-${index}`}
                                type="button"
                                onClick={() => handleTimeSlotClick(slot.time)}
                                disabled={!slot.available}
                                variant={
                                  formData.selectedTime === slot.time
                                    ? "default"
                                    : "outline"
                                }
                                className={`h-12 text-sm font-medium transition-all
                                  ${
                                    slot.available
                                      ? formData.selectedTime === slot.time
                                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                        : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                                      : "bg-red-50 text-red-400 border-red-200 cursor-not-allowed opacity-60"
                                  }
                                `}
                              >
                                <div className="flex flex-col items-center">
                                  <span>{slot.time}</span>
                                  {!slot.available && (
                                    <span className="text-xs">Unavailable</span>
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>

                          {!formData.selectedTime && (
                            <p className="text-sm text-blue-600 text-center">
                              Please select a time slot to continue
                            </p>
                          )}

                          {formData.selectedTime && (
                            <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Selected: {formData.selectedTime}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-lg">
                          <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                          <p className="text-blue-600 font-medium">
                            No available time slots
                          </p>
                          <p className="text-sm text-blue-500 mt-1">
                            Please try selecting a different date
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State for Time Slots when no date selected */}
                  {!formData.date && (
                    <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-blue-200 rounded-lg">
                      <div className="text-center text-blue-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Please select a date to see available time slots</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Customer Selection */}
          {currentStep === 5 && (
            <>
              <Card className="border-blue-200">
                <CardHeader className=" border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="">
                      {userRole === "global-admin" || userRole === "admin"
                        ? "Step 5: Select Customer"
                        : "Step 5: Your Information"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {userRole === "global-admin" || userRole === "admin" ? (
                    <>
                      {customersLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                          <span className="text-blue-700">
                            Loading customers...
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={formData.customerNo}
                          onValueChange={(value) =>
                            handleInputChange("customerNo", value)
                          }
                        >
                          <SelectTrigger className="border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem
                                key={customer.id}
                                value={customer.customerNo}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium ">
                                    {customer.name}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {customer.email && ` ${customer.email}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {customers.length === 0 && !customersLoading && (
                        <p className="text-sm text-blue-600 mt-2">
                          No customers available
                        </p>
                      )}
                    </>
                  ) : (
                    <Input
                      type="text"
                      value={formData.customerNo}
                      readOnly
                      className="bg-blue-50 text-base font-semibold  border-blue-200"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Booking Note and Submit */}
              <Card className="border-blue-200">
                <CardHeader className=" border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="">Special Notes (Optional)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Textarea
                    value={formData.bookingNote}
                    onChange={(e) =>
                      handleInputChange("bookingNote", e.target.value)
                    }
                    rows={4}
                    placeholder="Any special requirements or notes about your appointment..."
                    className="resize-none border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="pt-6">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !formData.selectedTime ||
                      !formData.customerNo
                    }
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating Your Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <BookingSummaryCard />
        </div>
      </div>
    </div>
  );
}