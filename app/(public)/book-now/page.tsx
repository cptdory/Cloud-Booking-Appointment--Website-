// page.tsx (Public Booking)
"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Loader2,
  Calendar,
  FileText,
  Users,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Mail,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Branch } from "@/types/branch";
import { BookingParameter } from "@/types/bookingParameter";

// Import hooks (only those that don't require authentication)
import { useBranches } from "@/hooks/useBranches";
import { useBookingSetup } from "@/hooks/useBookingSetup";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useToast } from "@/hooks/useToast";
import { useModalAlert } from "@/hooks/useAlert";
import { useBookingParams } from "@/hooks/useBookingParams";
// Import OTP Dialog component
import { OTPDialog } from "@/components/otp-dialog";

interface FormData {
  branch: string;
  service: string;
  staff: string;
  [key: string]: string | undefined;
  date: string;
  selectedTime: string;
  customerName: string;
  customerEmail: string;
  bookingNote: string;
  _CustomerPhoneNo?: string;
  _CustomerAddress1?: string;
  _CustomerAddress2?: string;
}

interface BookingSummary {
  branch: Branch | null;
  service: {
    id: string;
    name: string;
    duration: number;
    code: string;
    parameterId: string;
  } | null;
  staff: {
    id: string;
    name: string;
    code: string;
    parameterId: string;
  } | null;
  dynamicParameters: {
    parameterId: string;
    parameterName: string;
    valueName: string;
  }[];
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
  } | null;
}

export default function PublicBooking() {
  const router = useRouter();

  // Use hooks (no auth hooks needed)
  const { branches, loading: branchesLoading, fetchBranches } = useBranches();
  const {
    bookingSetup,
    loading: setupLoading,
    fetchBookingSetup,
  } = useBookingSetup();
  const {
    staffAssignments,
    loading: staffLoading,
    fetchStaffAssignments,
  } = useStaffAssignments();
  const {
    availableTimeSlots,
    loading: timeSlotsLoading,
    fetchAvailableTimeSlots,
  } = useTimeSlots();
  const { showError, showSuccess } = useToast();
  const { showError: showErrorAlert, showSuccess: showSuccessAlert } = useModalAlert();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [latestCompletedStep, setLatestCompletedStep] = useState<number>(1);
  const [modifiedSteps, setModifiedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    branch: "",
    service: "",
    staff: "",
    date: "",
    selectedTime: "",
    customerName: "",
    customerEmail: "",
    bookingNote: "",
    _CustomerPhoneNo: "",
    _CustomerAddress1: "",
    _CustomerAddress2: "",
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
  
  // OTP Flow States
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [processingBooking, setProcessingBooking] = useState(false);

  // Use booking params hook for dynamic parameters
  const dynamicParametersData = useBookingParams(
    formData.branch,
    "dynamic-param-id"
  );

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches().catch((error) => {
      showError(error, "Failed to load branches");
    });
  }, []);

  // Update booking summary when form data changes
  useEffect(() => {
    const updateBookingSummary = () => {
      const summary: BookingSummary = {
        branch: branches.find((b) => b.Code === formData.branch) || null,
        service: null,
        staff: null,
        dynamicParameters: [],
        date: formData.date,
        time: formData.selectedTime,
        customer:
          formData.customerName && formData.customerEmail
            ? {
                name: formData.customerName,
                email: formData.customerEmail,
              }
            : null,
      };

      // Set service info
      if (bookingSetup && formData.service) {
        const services = getServices();
        const selectedService = services.find(
          (s) => s.BookingParameterValueId.toString() === formData.service
        );
        if (selectedService) {
          const serviceParameter = getServiceParameter();
          summary.service = {
            id: selectedService.BookingParameterValueId.toString(),
            name: selectedService.BookingParamterValueDescription,
            duration: selectedService.BookingParameterValueDuration,
            code: selectedService.BookingParameterValueCode,
            parameterId: serviceParameter ? serviceParameter.BookingParameterId.toString() : '',
          };
        }
      }

      // Set staff info
      if (formData.staff) {
        const selectedStaff = staffAssignments.find(
          (s) => s.StaffId.toString() === formData.staff
        );
        if (selectedStaff) {
          const staffParameter = getStaffParameter();
          summary.staff = {
            id: selectedStaff.StaffId.toString(),
            name: selectedStaff.StaffName,
            code: selectedStaff.StaffCode,
            parameterId: staffParameter ? staffParameter.BookingParameterId.toString() : '',
          };
        }
      }

      // Set dynamic parameters info
      const dynamicParams = getDynamicParameters();
      dynamicParams.forEach((param) => {
        const valueId = formData[param.BookingParameterId.toString()];
        if (valueId) {
          const selectedValue = param.BookingParameterValue.find(
            (v) => v.BookingParameterValueId.toString() === valueId
          );
          if (selectedValue) {
            summary.dynamicParameters.push({
              parameterId: param.BookingParameterId.toString(),
              parameterName: param.BookingParameterCode,
              valueName: selectedValue.BookingParamterValueDescription,
            });
          }
        }
      });

      setBookingSummary(summary);
    };

    updateBookingSummary();
  }, [
    formData,
    branches,
    bookingSetup,
    staffAssignments,
  ]);

  const handleStepSelection = (step: number) => {
    // Can click on any step up to latestCompletedStep, or any unmodified step
    if (step <= latestCompletedStep || !modifiedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  const handleInputChange = async (
    field: keyof FormData,
    value: string
  ): Promise<void> => {
    // Check if we're changing a value in a previous step
    const previousStepFields: { [key: number]: (keyof FormData)[] } = {
      1: ["branch"],
      2: ["service"],
      3: ["staff"],
      4: ["date", "selectedTime"],
      5: ["customerName", "customerEmail", "bookingNote"],
    };

    // Find which step this field belongs to
    let fieldStep = 0;
    for (const [step, fields] of Object.entries(previousStepFields)) {
      if ((fields as (keyof FormData)[]).includes(field)) {
        fieldStep = parseInt(step);
        break;
      }
    }

    // If changing a field in a previous step and value is different
    if (fieldStep < currentStep && formData[field] !== value) {
      // Mark all steps after this one as modified
      const newModifiedSteps = new Set(modifiedSteps);
      for (let i = fieldStep + 1; i <= 5; i++) {
        newModifiedSteps.add(i);
      }
      setModifiedSteps(newModifiedSteps);

      // Reset latestCompletedStep to this step
      setLatestCompletedStep(fieldStep);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-advance steps based on selection with correct sequence
    if (field === "branch" && value) {
      try {
        await fetchBookingSetup(value);
        setCurrentStep(2);
        setLatestCompletedStep(2);

        // Mark step 2 as not modified since we just auto-advanced
        const newModifiedSteps = new Set(modifiedSteps);
        newModifiedSteps.delete(2);
        setModifiedSteps(newModifiedSteps);
      } catch (error: any) {
        showError(error, "Failed to load branch details");
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
        setLatestCompletedStep(3);

        // Mark step 3 as not modified since we just auto-advanced
        const newModifiedSteps = new Set(modifiedSteps);
        newModifiedSteps.delete(3);
        setModifiedSteps(newModifiedSteps);
      } catch (error: any) {
        showError(error, "Failed to load staff assignments");
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
          setLatestCompletedStep(4);

          // Mark step 4 as not modified since we just auto-advanced
          const newModifiedSteps = new Set(modifiedSteps);
          newModifiedSteps.delete(4);
          setModifiedSteps(newModifiedSteps);
        }
      }
    } else if (field === "selectedTime" && value && currentStep === 4) {
      setCurrentStep(5);
      setLatestCompletedStep(5);

      // Mark step 5 as not modified since we just auto-advanced
      const newModifiedSteps = new Set(modifiedSteps);
      newModifiedSteps.delete(5);
      setModifiedSteps(newModifiedSteps);
    }
  };

  const handleDynamicParameterChange = (
    parameterId: string,
    value: string
  ): void => {
    handleInputChange(parameterId as keyof FormData, value);
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

    // This will trigger the logic in handleInputChange to advance the step
    // and correctly update the latestCompletedStep state.
    void handleInputChange("selectedTime", formatTime(time));
  };

  // Fetch time slots when all prerequisites are met
  useEffect(() => {
    if (
      currentStep >= 4 &&
      formData.date &&
      formData.branch &&
      formData.service &&
      formData.staff
    ) {
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
          showError(error, "Failed to load time slots");
        });
      }
    }
  }, [formData.date, currentStep]);

  // Get service parameter (the one with BookingParameterService: true)
  const getServiceParameter = (): BookingParameter | undefined => {
    if (!bookingSetup?.BookingParameter) return undefined;
    return bookingSetup.BookingParameter.find(
      (param) => param.BookingParameterService
    );
  };

  // Get staff parameter (the one with BookingParameterStaff: true)
  const getStaffParameter = (): BookingParameter | undefined => {
    if (!bookingSetup?.BookingParameter) return undefined;
    return bookingSetup.BookingParameter.find(
      (param) => param.BookingParameterStaff
    );
  };

  // Get services from booking setup
  const getServices = () => {
    const serviceParameter = getServiceParameter();
    return serviceParameter?.BookingParameterValue || [];
  };

  // Get dynamic parameters (all parameters except service and staff)
  const getDynamicParameters = (): BookingParameter[] => {
    if (!bookingSetup?.BookingParameter) return [];

    return bookingSetup.BookingParameter.filter(
      (param) => !param.BookingParameterService && !param.BookingParameterStaff
    ).sort((a, b) => a.BookingParameterSequence - b.BookingParameterSequence);
  };

  // Function to create booking after OTP verification
  const createBooking = async (bookingData: any) => {
    setProcessingBooking(true);
    
    try {
      console.log("📤 Creating booking with data:", bookingData);

      const response = await fetch(
        "/api/available-timeslot/book-available-timeslot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      const result = await response.json();
      console.log("✅ Booking created successfully:", result);

      showSuccessAlert("Your appointment has been successfully scheduled!", "Booking Confirmed!");

      // Reset form
      const resetData: FormData = {
        branch: "",
        service: "",
        staff: "",
        date: "",
        selectedTime: "",
        customerName: "",
        customerEmail: "",
        bookingNote: "",
        _CustomerPhoneNo: "",
        _CustomerAddress1: "",
        _CustomerAddress2: "",
      };

      const dynamicParameters = getDynamicParameters();
      dynamicParameters.forEach((param) => {
        resetData[param.BookingParameterId.toString()] = "";
      });

      setFormData(resetData);
      setCurrentStep(1);
      setLatestCompletedStep(1);
      setModifiedSteps(new Set());
      setBookingSummary({
        branch: null,
        service: null,
        staff: null,
        dynamicParameters: [],
        date: "",
        time: "",
        customer: null,
      });
      
      // Close OTP dialog
      setShowOTPDialog(false);
      setIsOTPVerified(false);
      setPendingBookingData(null);
      
    } catch (error: any) {
      console.error("❌ Error creating booking:", error);
      const errorMessage = error.message || "Failed to create booking. Please try again.";
      showErrorAlert(errorMessage, "Booking Failed");
    } finally {
      setProcessingBooking(false);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();

    const dynamicParameters = getDynamicParameters();
    const allDynamicSelected = dynamicParameters.every(
      (param) => formData[param.BookingParameterId.toString()]
    );

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      showErrorAlert("Please enter a valid email address.", "Invalid Email");
      return;
    }

    if (
      !formData.branch ||
      !formData.service ||
      !formData.staff ||
      !allDynamicSelected ||
      !formData.date ||
      !formData.selectedTime ||
      !formData.customerName ||
      !formData.customerEmail
    ) {
      showErrorAlert("Please fill in all required fields before submitting.", "Missing Information");
      return;
    }

    setSubmitting(true);

    try {
      // Get service and staff parameters dynamically
      const serviceParameter = getServiceParameter();
      const staffParameter = getStaffParameter();

      if (!serviceParameter || !staffParameter) {
        throw new Error("Service or staff parameter not found");
      }

      // Create parameter IDs dynamically
      const parameterIds = [
        serviceParameter.BookingParameterId.toString(),
        staffParameter.BookingParameterId.toString(),
        ...dynamicParameters.map((p) => p.BookingParameterId.toString()),
      ].join("|");

      // Create parameter values in the same order
      const parameterValues = [
        formData.service,
        formData.staff,
        ...dynamicParameters.map(
          (p) => formData[p.BookingParameterId.toString()] || ""
        ),
      ].join("|");

      // Build body for public booking
      const bodyToSend = {
        _BookingSetupCode: formData.branch,
        _BookingDate: formData.date,
        _BookingStartTime: formData.selectedTime,
        _BookingParameterCount: (2 + dynamicParameters.length).toString(),
        _BookingParameterIDs: parameterIds,
        _BookingParameterValueIDs: parameterValues,
        _CustomerNoOrEmailAdd: formData.customerEmail,
        _BookingNote: formData.bookingNote || "",
        _BookingEntryNo: "",
        _CustomerName: formData.customerName,
        _CustomerPhoneNo: formData._CustomerPhoneNo || '',
        _CustomerAddress1: formData._CustomerAddress1 || '',
        _CustomerAddress2: formData._CustomerAddress2 || '',
      };

      console.log("📤 Booking data prepared:", bodyToSend);

      // Store booking data and show OTP dialog
      setPendingBookingData(bodyToSend);
      setShowOTPDialog(true);
      
    } catch (error: any) {
      console.error("❌ Error preparing booking:", error);
      const errorMessage = error.message || "Failed to prepare booking. Please try again.";
      showErrorAlert(errorMessage, "Booking Error");
      setSubmitting(false);
    }
  };

  // Handle OTP verification success
  const handleOTPVerified = () => {
    setIsOTPVerified(true);
  };

  // Handle proceeding with booking after OTP verification
const handleProceedWithBooking = (bookingData: any) => {
  if (bookingData) {
    console.log("✅ OTP verified, creating booking...");
    createBooking(bookingData);
  }
};

  // Handle OTP dialog close
  const handleOTPDialogClose = () => {
    setShowOTPDialog(false);
    setPendingBookingData(null);
    setSubmitting(false);
  };

  // Booking Summary Component
  const BookingSummaryCard = () => {
    const hasSummary =
      bookingSummary.branch ||
      bookingSummary.service ||
      bookingSummary.staff ||
      bookingSummary.date;

    if (!hasSummary) return null;

    return (
      <Card className="bg-white dark:bg-slate-900 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold dark:text-white">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Booking Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookingSummary.branch && (
              <div className="p-4 flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Branch:</span>
                <div className="text-right">
                  <span className="font-semibold dark:text-slate-200">{bookingSummary.branch.Description}</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{bookingSummary.branch.Location}</p>
                </div>
              </div>
            )}
            {bookingSummary.service && (
              <div className="p-4 flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Service:</span>
                <div className="text-right">
                  <span className="font-semibold dark:text-slate-200">{bookingSummary.service.name}</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{bookingSummary.service.duration} mins</p>
                </div>
              </div>
            )}
            {bookingSummary.staff && (
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Staff:</span>
                <span className="font-semibold text-right dark:text-slate-200">{bookingSummary.staff.name}</span>
              </div>
            )}
            {bookingSummary.dynamicParameters.length > 0 && (
                <div className="p-4 space-y-2">
                    {bookingSummary.dynamicParameters.map((param, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{param.parameterName}:</span>
                        <span className="font-semibold text-sm dark:text-slate-200">{param.valueName}</span>
                    </div>
                    ))}
                </div>
            )}
            {bookingSummary.date && (
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Date:</span>
                <span className="font-semibold dark:text-slate-200">{new Date(bookingSummary.date).toLocaleDateString()}</span>
              </div>
            )}
            {bookingSummary.time && (
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Time:</span>
                <span className="font-semibold dark:text-slate-200">{bookingSummary.time}</span>
              </div>
            )}
            {bookingSummary.customer && (
              <div className="p-4 flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
                <div className="text-right">
                  <span className="font-semibold dark:text-slate-200">{bookingSummary.customer.name}</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{bookingSummary.customer.email}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
    <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl space-y-8">

      {/* Welcome Banner for Public Users */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl p-8 text-white flex items-center">
            <Calendar className="w-12 h-12 mr-6 opacity-50 flex-shrink-0" />
            <div>
                <h1 className="text-3xl font-bold">Book Your Appointment</h1>
                <p className="mt-1 text-blue-100 dark:text-blue-200">
                  Effortless booking at Squadlethics. Choose your service and time below.
                </p>
            </div>
        </div>

      {/* Progress Steps */}
      <Card className="bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start">
                    {["Branch", "Service", "Details", "Date & Time", "Your Info"].map((label, index) => {
                        const step = index + 1;
                        const isCompleted = latestCompletedStep > step;
                        const isActive = step === currentStep;
                        const isClickable = step <= latestCompletedStep;
                        return (
                            <Fragment key={step}>
                                <div className="flex flex-col items-center text-center w-24">
                                    <button
                                        onClick={() => handleStepSelection(step)}
                                        disabled={!isClickable}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition-all duration-300
                                            ${isActive ? "bg-blue-600 text-white scale-110 shadow-lg"
                                            : isCompleted ? "bg-blue-500 text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                            }
                                            ${isClickable && !isActive ? "hover:bg-blue-200 dark:hover:bg-slate-600" : ""}
                                            ${!isClickable ? "cursor-not-allowed" : ""}`}
                                        title={!isClickable ? "Complete previous steps first" : label}
                                    >
                                        {isCompleted ? <CheckCircle2 size={24} /> : step}
                                    </button>
                                    <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {label}
                                    </p>
                                </div>
                                {step < 5 && (
                                    <div className={`flex-1 h-1 mt-5 transition-colors duration-500 ${isCompleted ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                                )}
                            </Fragment>
                        );
                    })}
                </div>
            </CardContent>
        </Card>

      {/* Step Navigation Buttons */}
      {currentStep > 1 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={submitting || processingBooking}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </Button>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Step {currentStep} of 5</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Branch Selection */}
          {currentStep === 1 && (
            <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 1: Choose Your Branch</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {branchesLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> <span className="text-slate-600 dark:text-slate-400">Loading branches...</span></div>
                ) : branches.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">No branches available</p>
                ) : (
                  <RadioGroup value={formData.branch} onValueChange={(v) => handleInputChange("branch", v)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {branches.map((branch) => (
                        <Label key={branch.Code} htmlFor={`branch-${branch.Code}`} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-300 ${formData.branch === branch.Code ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                          <RadioGroupItem value={branch.Code} id={`branch-${branch.Code}`} className="text-blue-600 mt-1" />
                          <div className="ml-3 flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{branch.Description}</div>
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
            <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3"><Briefcase className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 2: Select Service</CardTitle></div>
              </CardHeader>
              <CardContent className="pt-6">
                {setupLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> <span className="text-slate-600 dark:text-slate-400">Loading services...</span></div>
                ) : getServices().length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No services available</p>
                ) : (
                  <RadioGroup value={formData.service} onValueChange={(v) => handleInputChange("service", v)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getServices().map((service) => (
                        <Label key={service.BookingParameterValueId} htmlFor={`service-${service.BookingParameterValueId}`} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData.service === service.BookingParameterValueId.toString() ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                          <RadioGroupItem value={service.BookingParameterValueId.toString()} id={`service-${service.BookingParameterValueId}`} className="text-blue-600" />
                          <div className="ml-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{service.BookingParamterValueDescription}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{service.BookingParameterValueDuration} mins</div>
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
            <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3"><Users className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 3: Select Staff & Options</CardTitle></div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Select Staff</h3>
                  {staffLoading ? (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> <span className="text-slate-600 dark:text-slate-400">Loading staff...</span></div>
                  ) : staffAssignments.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No staff available for this service</p>
                  ) : (
                    <RadioGroup value={formData.staff} onValueChange={(v) => handleInputChange("staff", v)}>
                      <div className="space-y-2">
                        {staffAssignments.map((staff) => (
                          <Label key={staff.StaffId} htmlFor={`staff-${staff.StaffId}`} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData.staff === staff.StaffId.toString() ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                            <RadioGroupItem value={staff.StaffId.toString()} id={`staff-${staff.StaffId}`} className="text-blue-600" />
                            <div className="ml-3"><div className="font-medium text-slate-800 dark:text-slate-200">{staff.StaffName}</div></div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>

                {formData.staff && getDynamicParameters().length > 0 && (
                  <>
                    <Separator className="dark:bg-slate-800"/>
                    <div className="space-y-6">
                      {getDynamicParameters().map((parameter) => (
                        <div key={parameter.BookingParameterId}>
                          <h4 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">{parameter.BookingParameterCode}</h4>
                          <RadioGroup value={formData[parameter.BookingParameterId.toString()]} onValueChange={(value) => handleDynamicParameterChange(parameter.BookingParameterId.toString(), value)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {parameter.BookingParameterValue.map((value) => (
                                <Label key={value.BookingParameterValueId} htmlFor={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData[parameter.BookingParameterId.toString()] === value.BookingParameterValueId.toString() ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                                  <RadioGroupItem value={value.BookingParameterValueId.toString()} id={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`} className="text-blue-600" />
                                  <div className="ml-3"><div className="font-medium text-slate-800 dark:text-slate-200">{value.BookingParamterValueDescription}</div></div>
                                </Label>
                              ))}
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Date & Time Selection */}
          {currentStep === 4 && (
            <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800"><div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 4: Select Date & Time</CardTitle></div></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="booking-date" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Select Date</Label>
                      <Input id="booking-date" type="date" value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} min={new Date().toISOString().split("T")[0]} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-blue-500" />
                      {formData.date && (<p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Selected: {new Date(formData.date).toLocaleDateString()}</p>)}
                    </div>
                    {formData.date && availableTimeSlots.length > 0 && (
                      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"><CardContent className="p-4"><div className="grid grid-cols-3 gap-2 text-center">
                            <div><div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{availableTimeSlots.length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Total</div></div>
                            <div><div className="text-2xl font-bold text-green-600">{availableTimeSlots.filter((s) => s.available).length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Available</div></div>
                            <div><div className="text-2xl font-bold text-red-600">{availableTimeSlots.filter((s) => !s.available).length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Booked</div></div>
                      </div></CardContent></Card>
                    )}
                  </div>

                  <div className="space-y-4">
                    {formData.date ? (
                      <>
                          <Label className="text-base font-semibold block text-slate-700 dark:text-slate-300">Available Time Slots</Label>
                          {timeSlotsLoading ? (
                              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> <span className="text-slate-600 dark:text-slate-400">Finding available slots...</span></div>
                          ) : availableTimeSlots.length > 0 ? (
                              <div className="space-y-4">
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-1">
                                      {availableTimeSlots.map((slot, index) => (
                                      <Button key={`${slot.id}-${index}`} type="button" onClick={() => handleTimeSlotClick(slot.time)} disabled={!slot.available} variant={formData.selectedTime === slot.time ? "default" : "outline"}
                                          className={`h-12 text-sm font-semibold rounded-lg transition-all duration-300 ${!slot.available ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed" : formData.selectedTime === slot.time ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-white dark:ring-offset-slate-900" : "bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-700"}`}>
                                          {slot.time}
                                      </Button>
                                      ))}
                                  </div>
                                  {formData.selectedTime && (
                                      <div className="p-3 bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-center"><div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 font-medium"><CheckCircle2 className="w-4 h-4" />Selected: {formData.selectedTime}</div></div>
                                  )}
                              </div>
                          ) : (
                              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg"><Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-600 dark:text-slate-400 font-medium">No available time slots</p><p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Please try a different date</p></div>
                          )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="text-center text-slate-500 dark:text-slate-400"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Select a date to see time slots</p></div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Customer Information */}
          {currentStep === 5 && (
            <>
                <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800"><div className="flex items-center gap-3"><User className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 5: Your Information</CardTitle></div></CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="customer-name" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Full Name *</Label>
                      <Input id="customer-name" type="text" placeholder="Enter your full name" value={formData.customerName} onChange={(e) => handleInputChange("customerName", e.target.value)} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <Label htmlFor="customer-email" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Email Address *</Label>
                      <Input id="customer-email" type="email" placeholder="Enter your email address" value={formData.customerEmail} onChange={(e) => handleInputChange("customerEmail", e.target.value)} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A confirmation with OTP will be sent to this email.</p>
                    </div>
                    <div>
                      <Label htmlFor="customer-phone" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Phone Number</Label>
                      <Input id="customer-phone" type="text" placeholder="Enter your phone number" value={formData._CustomerPhoneNo} onChange={(e) => handleInputChange("_CustomerPhoneNo", e.target.value)} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <Label htmlFor="customer-address1" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Address 1</Label>
                      <Textarea id="customer-address1" placeholder="House No / Street / Barangay" value={formData._CustomerAddress1} onChange={(e) => handleInputChange("_CustomerAddress1", e.target.value)} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <Label htmlFor="customer-address2" className="text-base font-semibold mb-2 block text-slate-700 dark:text-slate-300">Address 2</Label>
                      <Textarea id="customer-address2" placeholder="City / Province / Additional Info" value={formData._CustomerAddress2} onChange={(e) => handleInputChange("_CustomerAddress2", e.target.value)} className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800"><div className="flex items-center gap-3"><FileText className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Special Notes (Optional)</CardTitle></div></CardHeader>
                    <CardContent className="pt-6">
                        <Textarea value={formData.bookingNote} onChange={(e) => handleInputChange("bookingNote", e.target.value)} rows={4} placeholder="Any special requirements..." className="resize-none border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500"/>
                    </CardContent>
                </Card>

                <Card className="bg-transparent shadow-none border-none">
                  <CardContent className="p-0">
                    <Button type="button" onClick={handleSubmit} disabled={submitting || processingBooking || !formData.selectedTime || !formData.customerName || !formData.customerEmail} size="lg" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                      {submitting ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" /> Preparing...</>)
                      : processingBooking ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating Booking...</>)
                      : (<><CheckCircle2 className="w-5 h-5 mr-2" /> Confirm & Book Appointment</>)}
                    </Button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">By clicking, you agree to our terms and to receive booking-related emails.</p>
                  </CardContent>
                </Card>
              </>
          )}
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingSummaryCard />
          </div>
        </div>
      </div>

      {/* OTP Dialog */}
      {showOTPDialog && (
        <OTPDialog
          isOpen={showOTPDialog}
          onClose={handleOTPDialogClose}
          onOTPVerified={handleOTPVerified}
          onProceedWithBooking={handleProceedWithBooking}
          customerEmail={formData.customerEmail}
          bookingData={pendingBookingData}
        />
      )}
    </main>
    </div>
  );
}