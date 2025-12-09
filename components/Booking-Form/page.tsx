// page.tsx (refactored)
"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronsUpDown,
  Mail,
  Lock,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, XCircle } from "lucide-react";
import { Branch } from "@/types/branch";
import { BookingParameter } from "@/types/bookingParameter";

// Import hooks
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useBranches";
import { useBookingSetup } from "@/hooks/useBookingSetup";
import { useStaffAssignments } from "@/hooks/useStaffAssignments";
import { useCustomers } from "@/hooks/useCustomers";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useModalAlert } from "@/hooks/useAlert";
import { useToast } from "@/hooks/useToast";
import { useBookingParams } from "@/hooks/useBookingParams";

interface FormData {
  branch: string;
  service: string;
  staff: string;
  [key: string]: string;
  date: string;
  selectedTime: string;
  customerNo: string;
  customerEmail: string;
  customerName: string;
  bookingNote: string;
  _BookingEntryNo: string;
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
    customerNo: string;
    name: string;
    email: string;
  } | null;
}

export default function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use hooks
  const { userRole, username, customerNo, customerEmail, checkingAuth } = useAuth();
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
  const { customers, loading: customersLoading } = useCustomers(userRole);
  const {
    availableTimeSlots,
    loading: timeSlotsLoading,
    fetchAvailableTimeSlots,
  } = useTimeSlots();
  const { showSuccess, showError, showInfo, showWarning } = useModalAlert();

  const { showSuccess: showToastSuccess } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [latestCompletedStep, setLatestCompletedStep] = useState<number>(1);
  const [modifiedSteps, setModifiedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    branch: "",
    service: "",
    staff: "",
    date: "",
    selectedTime: "",
    customerNo: "",
    customerEmail: "",
    customerName: "",
    bookingNote: "",
    _BookingEntryNo: "",
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
  const [isCustomerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isReschedule, setIsReschedule] = useState(false);
  const [isLoadingRescheduleData, setIsLoadingRescheduleData] = useState(false);
  const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set());

  // Use booking params hook for dynamic parameters
  const dynamicParametersData = useBookingParams(
    formData.branch,
    "dynamic-param-id"
  );

  // Load reschedule data from URL if present
  useEffect(() => {
    const entryNo = searchParams.get("reschedule");
          if (entryNo) {
            setIsReschedule(true);
            setLatestCompletedStep(5); // Mark all steps as completed for reschedule
            loadRescheduleData(entryNo);
          }  }, [searchParams]);

  // Load reschedule data from API
  const loadRescheduleData = async (entryNo: string) => {
    setIsLoadingRescheduleData(true);
    try {
      const response = await fetch("/api/booking-entry/get-booking-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _BookingEntryNo: entryNo }),
      });

      if (!response.ok) throw new Error("Failed to load booking entry");

      const responseData = await response.json();
      console.log("📥 Full Response Data:", responseData);
      
      // The API returns { success: true, data: { value: "..." } }
      let data;
      
      // First, extract the data from the wrapper if it exists
      let bcResponse = responseData.data || responseData;
      console.log("BC Response:", bcResponse);
      
      // Now handle the BC response which may have a "value" field
      if (bcResponse.value) {
        // API returns value as a JSON string
        console.log("Parsing value field:", bcResponse.value);
        try {
          data = typeof bcResponse.value === "string" 
            ? JSON.parse(bcResponse.value) 
            : bcResponse.value;
        } catch (e) {
          console.error("Failed to parse value:", e);
          throw new Error("Failed to parse booking entry data");
        }
      } else if (Array.isArray(bcResponse)) {
        // Response is already an array
        data = bcResponse;
      } else {
        console.error("Unexpected response format:", {
          hasValue: !!bcResponse.value,
          isArray: Array.isArray(bcResponse),
          keys: Object.keys(bcResponse),
        });
        throw new Error("Invalid booking entry response format");
      }

      console.log("📦 Parsed Data:", data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("No booking entry found");
      }

      const entry = data[0];
      console.log("📋 Entry Details:", entry);
      console.log("📋 Entry Keys:", Object.keys(entry));
      console.log("📋 Customer Name Field:", entry.Name);
      console.log("📋 Customer Email Field:", entry.EMail || entry.Email);
      console.log("📋 Customer No Field:", entry.CustomerNo);

      // Build the form data from the fetched entry
      const newFormData: FormData = {
        branch: entry.BookingSetupCode || "",
        service: "",
        staff: "",
        date: entry.BookingStartDate || "",
        selectedTime: entry.BookingStartTime || "",
        customerNo: entry.CustomerNo || "",
        customerEmail: entry.EMail || entry.Email || "",
        customerName: entry.Name || entry.CustomerName || "",
        bookingNote: entry.BookingNote || "",
        _BookingEntryNo: entryNo,
      };

      console.log("📋 Form Data After Mapping:", newFormData);

      // Map booking parameters to form data
      // Store parameter value IDs (numeric) for form fields
      if (entry.BookingParameters && Array.isArray(entry.BookingParameters)) {
        entry.BookingParameters.forEach((param: any) => {
          // Store the parameter value ID (numeric), not the code
          const valueId = param.BookingParameterValueId.toString();
          newFormData[param.BookingParameterId.toString()] = valueId;

          // Determine if it's service or staff - store the ID for API calls
          if (param.BookingParameterCode === "SERVICES") {
            newFormData.service = valueId;
          } else if (param.BookingParameterCode === "STAFF") {
            newFormData.staff = valueId;
          }
        });
      }

      setFormData(newFormData);

      // If customer name is not in the entry, fetch customer details separately
      if (!newFormData.customerName && newFormData.customerNo) {
        try {
          console.log("Fetching customer details for:", newFormData.customerNo);
          const customerRes = await fetch("/api/customer/get-customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _CustomerNo: newFormData.customerNo }),
          });

          if (customerRes.ok) {
            const customerData = await customerRes.json();
            console.log("📧 Customer Data:", customerData);
            
            if (customerData && customerData.data) {
              let customerInfo = customerData.data;
              
              // Parse if it's a string
              if (typeof customerInfo === "string") {
                try {
                  customerInfo = JSON.parse(customerInfo);
                } catch (e) {
                  console.warn("Could not parse customer data as JSON");
                }
              }
              
              // If it's wrapped in an array, get first item
              if (Array.isArray(customerInfo) && customerInfo.length > 0) {
                customerInfo = customerInfo[0];
              }
              
              // Update form data with customer details
              newFormData.customerName = customerInfo.Name || customerInfo.DisplayName || newFormData.customerName;
              newFormData.customerEmail = customerInfo.EMail || customerInfo.Email || newFormData.customerEmail;
              
              console.log("📧 Updated Form Data with Customer Details:", newFormData);
              setFormData(newFormData);
            }
          }
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }
      }

      // Fetch booking setup for the loaded branch
      try {
        console.log("Fetching booking setup for branch:", entry.BookingSetupCode);
        await fetchBookingSetup(entry.BookingSetupCode);
      } catch (error: any) {
        console.error("Error fetching booking setup:", error);
      }

      // Mark all fields except date and time as read-only (including customer info)
      const readOnly = new Set([
        "branch",
        "service",
        "staff",
        "customerNo",
        "customerEmail",
        "customerName",
        "bookingNote",
      ]);

      // Add dynamic parameters to read-only
      if (entry.BookingParameters && Array.isArray(entry.BookingParameters)) {
        entry.BookingParameters.forEach((param: any) => {
          readOnly.add(param.BookingParameterId.toString());
        });
      }

      setReadOnlyFields(readOnly);

      showInfo(
        "Reschedule Loaded",
        "Booking entry loaded. Only date and time are editable."
      );
    } catch (error: any) {
      console.error("Error loading reschedule data:", error);
      showError(
        "Error Loading Booking",
        error.message || "Failed to load booking entry."
      );
    } finally {
      setIsLoadingRescheduleData(false);
    }
  };

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches().catch((error) => {
      showError(
        "Failed to Load Branches",
        error.message || "Please try again later."
      );
    });
  }, []);

  // Load staff assignments when reschedule data is loaded and booking setup is ready
  useEffect(() => {
    if (
      isReschedule &&
      !isLoadingRescheduleData &&
      formData.branch &&
      formData.service &&
      bookingSetup
    ) {
      console.log(
        "Fetching staff assignments for reschedule - Branch:",
        formData.branch,
        "Service:",
        formData.service
      );
      fetchStaffAssignments(formData.branch, formData.service).catch(
        (error) => {
          console.error("Error fetching staff assignments:", error);
        }
      );
    }
  }, [
    isReschedule,
    isLoadingRescheduleData,
    formData.branch,
    formData.service,
    bookingSetup,
    fetchStaffAssignments,
  ]);

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
        customer: null,
      };

      // Set customer info
      if (userRole === "admin" || userRole === "global-admin") {
        // For admin users, use selected customer
        const selectedCustomer = customers.find(
          (c) => c.customerNo === formData.customerNo
        );
        if (selectedCustomer) {
          summary.customer = {
            customerNo: selectedCustomer.customerNo,
            name: selectedCustomer.name,
            email: selectedCustomer.email || "",
          };
        }
      } else {
        // For non-admin users, use their own info
        if (formData.customerNo) {
          summary.customer = {
            customerNo: formData.customerNo,
            name: formData.customerName || username || "Customer",
            email: formData.customerEmail || "",
          };
        }
      }

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
    customers,
    userRole,
    username,
  ]);

  const handleStepSelection = (step: number) => {
    // Can only click on steps up to latestCompletedStep (previous steps must be complete)
    if (step <= latestCompletedStep) {
      setCurrentStep(step);
    }
  };

  const handleInputChange = async (
    field: keyof FormData,
    value: string
  ): Promise<void> => {
    // Don't allow changes to read-only fields in reschedule mode
    if (isReschedule && readOnlyFields.has(field.toString())) {
      return;
    }

    // Check if we're changing a value in a previous step
    const previousStepFields: { [key: number]: (keyof FormData)[] } = {
      1: ["branch"],
      2: ["service"],
      3: ["staff"],
      4: ["date", "selectedTime"],
      5: ["customerNo", "customerName", "customerEmail", "bookingNote"],
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
        showError(
          "Failed to Load Branch Details",
          error.message ||
          "Please try selecting a different branch or try again later."
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
        setLatestCompletedStep(3);

        // Mark step 3 as not modified since we just auto-advanced
        const newModifiedSteps = new Set(modifiedSteps);
        newModifiedSteps.delete(3);
        setModifiedSteps(newModifiedSteps);
      } catch (error: any) {
        showError(
          "Failed to Load Staff Assignments",
          error.message || "Please try selecting a different service."
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
          showError(
            "Failed to Load Time Slots",
            error.message || "Please try selecting a different date or time."
          );
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

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();

    const dynamicParameters = getDynamicParameters();
    const allDynamicSelected = dynamicParameters.every(
      (param) => formData[param.BookingParameterId.toString()]
    );

    // Email validation for non-admin users
    if (userRole !== "admin" && userRole !== "global-admin") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        showError(
          "Invalid Email",
          "Please enter a valid email address."
        );
        return;
      }
    }

    if (
      !formData.branch ||
      !formData.service ||
      !formData.staff ||
      !allDynamicSelected ||
      !formData.date ||
      !formData.selectedTime ||
      !formData.customerNo
    ) {
      showError(
        "Missing Information",
        "Please fill in all required fields before submitting."
      );
      return;
    }

    // Additional validation for non-admin users
    if (userRole !== "admin" && userRole !== "global-admin") {
      if (!formData.customerName) {
        showError(
          "Missing Information",
          "Please enter your name before submitting."
        );
        return;
      }
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

      // Build body
      const bodyToSend: any = {
        _BookingSetupCode: formData.branch,
        _BookingDate: formData.date,
        _BookingStartTime: formData.selectedTime,
        _BookingParameterCount: (2 + dynamicParameters.length).toString(),
        _BookingParameterIDs: parameterIds,
        _BookingParameterValueIDs: parameterValues,
        _CustomerNoOrEmailAdd: formData.customerNo,
        _BookingNote: formData.bookingNote || "",
        _BookingEntryNo: isReschedule ? formData._BookingEntryNo : "",
      };

      // Add customer name for public-like functionality
      if (userRole !== "admin" && userRole !== "global-admin") {
        bodyToSend._CustomerName = formData.customerName;
      }

      console.log("📤 Sent Body:", bodyToSend);

      const response = await fetch(
        "/api/available-timeslot/book-available-timeslot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyToSend),
        }
      );

      if (!response.ok) throw new Error("Failed to create booking");
      await response.json();

      const successMessage = isReschedule
        ? "Your appointment has been successfully rescheduled."
        : "Your appointment has been successfully scheduled.";

      showToastSuccess(successMessage);

      // Reset or redirect
      if (isReschedule) {
        router.push("/calendar");
      } else {
        // Reset form
        const resetData: FormData = {
          branch: "",
          service: "",
          staff: "",
          date: "",
          selectedTime: "",
          customerNo: userRole === "admin" || userRole === "global-admin" ? "" : customerNo,
          customerEmail: "",
          customerName: "",
          bookingNote: "",
          _BookingEntryNo: "",
        };

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
      }
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      showError(
        "Booking Failed",
        "Failed to create booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Set customer info for non-admin users
  useEffect(() => {
    if (customerNo && userRole !== "admin" && userRole !== "global-admin") {
      setFormData((prev) => ({
        ...prev,
        customerNo: customerNo,
        customerName: username || "",
        customerEmail: customerEmail || "", // Include customerEmail
      }));
    }
  }, [customerNo, userRole, username, customerEmail]);

  // Handle customer selection for admin users
  const handleCustomerSelect = (customerNo: string) => {
    const selectedCustomer = customers.find(c => c.customerNo === customerNo);
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customerNo: selectedCustomer.customerNo,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || "",
      }));
    }
  };

  // Auto-select customer when reschedule data is loaded and customers are available
  useEffect(() => {
    if (
      isReschedule &&
      !isLoadingRescheduleData &&
      formData.customerNo &&
      customers.length > 0 &&
      !customersLoading &&
      (userRole === "admin" || userRole === "global-admin")
    ) {
      handleCustomerSelect(formData.customerNo);
    }
  }, [
    isReschedule,
    isLoadingRescheduleData,
    formData.customerNo,
    customers,
    customersLoading,
    userRole,
  ]);

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
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {bookingSummary.customer.customerNo}
                  {bookingSummary.customer.email && ` • ${bookingSummary.customer.email}`}
                </p>
              </div>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name &&
        customer.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (customer.customerNo &&
        customer.customerNo
          .toLowerCase()
          .includes(customerSearch.toLowerCase())) ||
      (customer.email &&
        customer.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Show loading while checking authentication or loading reschedule data
  if (checkingAuth || isLoadingRescheduleData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-slate-500 dark:text-slate-400">
            {isLoadingRescheduleData
              ? "Loading booking details..."
              : "Checking authentication..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">


      {/* User Info Banner */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold dark:text-slate-200">
                  Welcome, {username || "User"}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <Badge
                    variant={
                      userRole === "admin" || userRole === "global-admin"
                        ? "default"
                        : "secondary"
                    }
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                  >
                    {userRole === "admin" || userRole === "global-admin"
                      ? "Administrator"
                      : "Customer"}
                  </Badge>
                  {userRole !== "admin" && userRole !== "global-admin" && customerNo && (
                    <span className="dark:text-slate-400">ID: {customerNo}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card className="bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-6">
            <div className="flex items-start">
                {["Branch", "Service", "Details", "Date & Time", "Customer"].map((label, index) => {
                    const step = index + 1;
                    const isCompleted = latestCompletedStep > step;
                    const isActive = step === currentStep;
                    const isClickable = isReschedule || step <= latestCompletedStep;
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
            disabled={submitting}
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
                  <RadioGroup
                    value={formData.branch}
                    onValueChange={(value) =>
                      handleInputChange("branch", value)
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {branches.map((branch) => (
                        <Label
                          key={branch.Code}
                          htmlFor={`branch-${branch.Code}`}
                          className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-300 ${formData.branch === branch.Code ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                          <RadioGroupItem
                            value={branch.Code}
                            id={`branch-${branch.Code}`}
                            className="text-blue-600 mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
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
                  <RadioGroup
                    value={formData.service}
                    onValueChange={(value) =>
                      handleInputChange("service", value)
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getServices().map((service) => (
                        <Label
                          key={service.BookingParameterValueId}
                          htmlFor={`service-${service.BookingParameterValueId}`}
                          className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData.service ===
                              service.BookingParameterValueId.toString()
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                        >
                          <RadioGroupItem
                            value={service.BookingParameterValueId.toString()}
                            id={`service-${service.BookingParameterValueId}`}
                            className="text-blue-600"
                          />
                          <div className="ml-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {service.BookingParamterValueDescription}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
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
            <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3"><Users className="w-6 h-6 text-blue-600" /><CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Step 3: Select Staff & Options</CardTitle></div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Staff Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Select Staff</h3>
                  {staffLoading ? (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" /> <span className="text-slate-600 dark:text-slate-400">Loading staff...</span></div>
                  ) : staffAssignments.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">
                      No staff available for this service
                    </p>
                  ) : (
                    <RadioGroup
                      value={formData.staff}
                      onValueChange={(value) =>
                        handleInputChange("staff", value)
                      }
                    >
                      <div className="space-y-2">
                        {staffAssignments.map((staff) => (
                          <Label
                            key={staff.StaffId}
                            htmlFor={`staff-${staff.StaffId}`}
                            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData.staff === staff.StaffId.toString()
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                          >
                            <RadioGroupItem
                              value={staff.StaffId.toString()}
                              id={`staff-${staff.StaffId}`}
                              className="text-blue-600"
                            />
                            <div className="ml-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {staff.StaffName}
                              </div>
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
                    <Separator className="dark:bg-slate-800"/>
                    <div>
                      <div className="space-y-6">
                        {getDynamicParameters().map((parameter) => (
                          <div key={parameter.BookingParameterId}>
                            <h4 className="font-medium mb-3 text-slate-800 dark:text-slate-200">
                              {parameter.BookingParameterCode}
                            </h4>
                            <RadioGroup
                              value={
                                formData[
                                parameter.BookingParameterId.toString()
                                ]
                              }
                              onValueChange={(value) =>
                                handleDynamicParameterChange(
                                  parameter.BookingParameterId.toString(),
                                  value
                                )
                              }
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {parameter.BookingParameterValue.map(
                                  (value) => (
                                    <Label
                                      key={value.BookingParameterValueId}
                                      htmlFor={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`}
                                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-300 ${formData[
                                          parameter.BookingParameterId.toString()
                                        ] ===
                                          value.BookingParameterValueId.toString()
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 shadow-inner"
                                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                      <RadioGroupItem
                                        value={value.BookingParameterValueId.toString()}
                                        id={`param-${parameter.BookingParameterId}-${value.BookingParameterValueId}`}
                                        className="text-blue-600"
                                      />
                                      <div className="ml-3">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                          {
                                            value.BookingParamterValueDescription
                                          }
                                        </div>
                                      </div>
                                    </Label>
                                  )
                                )}
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
                              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg"><Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-600 dark:text-slate-400 font-medium">No available time slots</p><p className="text-sm text-slate-500 mt-1">Please try a different date</p></div>
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
                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      Step 5: Customer Information
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* For admin users: Customer selection */}
                  {(userRole === "global-admin" || userRole === "admin") ? (
                    <>
                      {customersLoading || isLoadingRescheduleData ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                          <span className="text-slate-500 dark:text-slate-400">
                            {isLoadingRescheduleData ? "Loading booking details..." : "Loading customers..."}
                          </span>
                        </div>
                      ) : isReschedule ? (
                        // Display customer info as read-only during reschedule
                        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm">
                            <Lock className="w-4 h-4" />
                            Customer locked for reschedule
                          </div>
                          <div className="space-y-3">
                            {formData.customerName ? (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Customer Name:</span>
                                <span className="dark:text-slate-200 font-semibold text-right">{formData.customerName}</span>
                              </div>
                            ) : null}
                            {formData.customerEmail ? (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Email:</span>
                                <span className="dark:text-slate-200 font-semibold text-right text-sm">{formData.customerEmail}</span>
                              </div>
                            ) : null}
                            {formData.customerNo ? (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Customer ID:</span>
                                <span className="dark:text-slate-200 font-semibold text-right">{formData.customerNo}</span>
                              </div>
                            ) : null}
                            {!formData.customerName && !formData.customerEmail && !formData.customerNo && (
                              <div className="text-slate-500 dark:text-slate-400 text-sm italic">
                                Loading customer information...
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Popover
                          open={isCustomerPopoverOpen}
                          onOpenChange={setCustomerPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isCustomerPopoverOpen}
                              className="w-full justify-between h-12 text-base dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            >
                              <span className="truncate dark:text-slate-200">
                                {formData.customerNo
                                  ? customers.find(
                                      (customer) =>
                                        customer.customerNo ===
                                        formData.customerNo
                                    )?.name
                                  : "Select a customer"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-[550px] p-0 dark:bg-slate-950 dark:border-slate-800 shadow-2xl rounded-xl">
                            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                                <Input
                                  placeholder="Search by name, email, or ID..."
                                  value={customerSearch}
                                  onChange={(e) =>
                                    setCustomerSearch(e.target.value)
                                  }
                                  className="pl-10 h-11 text-base dark:bg-slate-900 dark:border-slate-700"
                                />
                              </div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto">
                              {filteredCustomers.length > 0 ? (
                                <div className="p-1">
                                  {filteredCustomers.map((customer) => (
                                    <div
                                      key={customer.id}
                                      onClick={() => {
                                        handleCustomerSelect(
                                          customer.customerNo
                                        );
                                        setCustomerPopoverOpen(false);
                                      }}
                                      className={`p-3 flex items-center justify-between rounded-lg cursor-pointer transition-colors duration-150 ${
                                        formData.customerNo ===
                                        customer.customerNo
                                          ? "bg-blue-600 text-white"
                                          : "hover:bg-blue-100 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span
                                          className={`font-semibold ${
                                            formData.customerNo ===
                                            customer.customerNo
                                              ? "text-white"
                                              : "text-slate-800 dark:text-slate-200"
                                          }`}
                                        >
                                          {customer.name}
                                        </span>
                                        <span
                                          className={`text-sm ${
                                            formData.customerNo ===
                                            customer.customerNo
                                              ? "text-blue-200"
                                              : "text-slate-500 dark:text-slate-400"
                                          }`}
                                        >
                                          {customer.customerNo}
                                          {customer.email &&
                                            ` • ${customer.email}`}
                                        </span>
                                      </div>
                                      {formData.customerNo ===
                                        customer.customerNo && (
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-6 text-center text-base text-slate-500 dark:text-slate-400">
                                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                  No customers found.
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {customers.length === 0 && !customersLoading && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                          No customers available
                        </p>
                      )}

                      {/* Display selected customer info for new bookings */}
                      {!isReschedule && formData.customerNo && (
                        <div className="space-y-3 mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Customer Name:</span>
                            <span className="dark:text-slate-200">{formData.customerName}</span>
                          </div>
                          {formData.customerEmail && (
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Email:</span>
                              <span className="dark:text-slate-200">{formData.customerEmail}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    // For non-admin users: Display and edit their info
                    <>
                      {/* Check if the customer is logged in (not admin/global-admin and has a customerNo) and not rescheduling */}
                      {!isReschedule && customerNo && (userRole !== "admin" && userRole !== "global-admin") ? (
                        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm">
                            <Lock className="w-4 h-4" />
                            Customer information pre-filled from your account.
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Customer ID:</span>
                              <span className="dark:text-slate-200 font-semibold text-right">{formData.customerNo}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Full Name:</span>
                              <span className="dark:text-slate-200 font-semibold text-right">{formData.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Email:</span>
                              <span className="dark:text-slate-200 font-semibold text-right text-sm">{formData.customerEmail}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="customer-no" className="text-base font-semibold mb-2 block dark:text-slate-300">
                              Customer ID
                            </Label>
                            <Input
                              id="customer-no"
                              type="text"
                              value={formData.customerNo}
                              readOnly
                              className="bg-slate-100 dark:bg-slate-800 text-base font-semibold border-slate-200 dark:border-slate-700"
                            />
                          </div>

                          <div>
                            <Label htmlFor="customer-name" className="text-base font-semibold mb-2 block dark:text-slate-300">
                              Full Name *
                            </Label>
                            <Input
                              id="customer-name"
                              type="text"
                              placeholder="Enter your full name"
                              value={formData.customerName}
                              onChange={(e) =>
                                handleInputChange("customerName", e.target.value)
                              }
                              className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="customer-email" className="text-base font-semibold mb-2 block dark:text-slate-300">
                              Email Address *
                            </Label>
                            <Input
                              id="customer-email"
                              type="email"
                              placeholder="Enter your email address"
                              value={formData.customerEmail}
                              onChange={(e) =>
                                handleInputChange("customerEmail", e.target.value)
                              }
                              className="text-base border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              A confirmation email will be sent to this address
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Booking Note and Submit */}
              <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Special Notes (Optional)</CardTitle>
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
                    className="resize-none border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-blue-500 focus:ring-blue-500"
                  />
                </CardContent>
              </Card>

              <Card className="bg-transparent shadow-none border-none">
                <CardContent className="p-0">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !formData.selectedTime ||
                      !formData.customerNo ||
                      (userRole !== "admin" && userRole !== "global-admin" && (!formData.customerName || !formData.customerEmail))
                    }
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
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
                  {(userRole !== "admin" && userRole !== "global-admin") && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                      By clicking "Confirm Booking", you agree to receive confirmation emails for your appointment.
                    </p>
                  )}
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