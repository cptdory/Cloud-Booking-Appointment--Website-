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

interface FormData {
  branch: string;
  service: string;
  staff: string;
  [key: string]: string; // For dynamic parameters
  date: string;
  selectedTime: string;
  customerNo: string;
  bookingNote: string;
}

interface Branch {
  Code: string;
  Description: string;
  Location: string;
}

interface BookingParameter {
  BookingParameterId: number;
  BookingParameterCode: string;
  BookingParameterSequence: number;
  BookingParameterCheckAvailability: boolean;
  BookingParameterCheckDuration: boolean;
  BookingParameterStaff: boolean;
  BookingParameterService: boolean;
  BookingParameterValue: {
    BookingParameterValueId: number;
    BookingParameterValueCode: string;
    BookingParamterValueDescription: string;
    BookingParameterValueDuration: number;
  }[];
}

interface BookingSetup {
  BookingSetupCode: string;
  BookingSetupDescription: string;
  BookingSetupTimeIncrement: number;
  BookingSetupAllowableTime: number;
  BookingParameter: BookingParameter[];
  BookingServiceStaffRela: any[];
  BookingServiceDefaultValue: any[];
  BookingBusinessHours: any[];
}

interface StaffAssignment {
  BookingSetupCode: string;
  BookingParameterId_Staff: number;
  ServiceId: number;
  StaffId: number;
  StaffCode: string;
  StaffName: string;
}

interface Customer {
  id: string;
  customerNo: string;
  name: string;
  email?: string;
}

interface AvailableTimeSlot {
  id: number;
  time: string;
  available: boolean;
}

// Add this interface for booking summary
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bookingSetup, setBookingSetup] = useState<BookingSetup | null>(null);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>(
    []
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    AvailableTimeSlot[]
  >([]);

  // Alert states
  const [alert, setAlert] = useState<{
    show: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive";
  }>({
    show: false,
    title: "",
    description: "",
    variant: "default",
  });

  const [loading, setLoading] = useState({
    branches: false,
    branchDetails: false,
    staffAssignments: false,
    timeSlots: false,
    submitting: false,
    customers: false,
  });

  const [formData, setFormData] = useState<FormData>({
    branch: "",
    service: "",
    staff: "",
    date: "",
    selectedTime: "",
    customerNo: "",
    bookingNote: "",
  });

  const [checkingAuth, setCheckingAuth] = useState(true);

  // Booking summary state
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    branch: null,
    service: null,
    staff: null,
    dynamicParameters: [],
    date: "",
    time: "",
    customer: null,
  });

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

  // Show alert function
  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default"
  ) => {
    setAlert({
      show: true,
      title,
      description,
      variant,
    });

    // Auto-hide after 6 seconds
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 6000);
  };

  // Authentication check
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/signin");
        } else {
          setUsername(data.user.name);
          setUserRole(data.user.role);
          setCustomerNo(data.user.customerNo || "");
        }
      })
      .catch(() => {
        router.replace("/signin");
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  // Step 1: Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading((prev) => ({ ...prev, branches: true }));
      try {
        const res = await fetch("/api/booking-setup/get-booking-setup-list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${res.status}`
          );
        }

        const data = await res.json();

        // Data is already parsed by API route
        const branchesData = data.value || [];
        setBranches(branchesData);
      } catch (error: any) {
        console.error("❌ Error fetching branches:", error);
        showAlert(
          "Failed to Load Branches",
          error.message || "Please try again later.",
          "destructive"
        );
      } finally {
        setLoading((prev) => ({ ...prev, branches: false }));
      }
    };

    fetchBranches();
  }, []);

  // Step 2: Fetch booking setup when branch is selected
  const fetchBranchDetails = async (branchCode: string) => {
    setLoading((prev) => ({ ...prev, branchDetails: true }));
    try {
      const res = await fetch("/api/booking-setup/get-booking-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: branchCode,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch branch details");
      const data = await res.json();

      // Parse the stringified JSON from API
      let setupData = data.value;
      if (typeof setupData === "string") {
        setupData = JSON.parse(setupData);
      }

      // Handle array response
      const finalData = Array.isArray(setupData) ? setupData[0] : setupData;

      setBookingSetup(finalData);
      setCurrentStep(2);
    } catch (error) {
      console.error("❌ Error fetching branch details:", error);
      showAlert(
        "Failed to Load Branch Details",
        "Please try selecting a different branch or try again later.",
        "destructive"
      );
    } finally {
      setLoading((prev) => ({ ...prev, branchDetails: false }));
    }
  };

  // Step 3: Fetch staff assignments when service is selected
  const fetchStaffAssignments = async (serviceId: string) => {
    setLoading((prev) => ({ ...prev, staffAssignments: true }));
    try {
      const res = await fetch(
        "/api/booking-service-staff-rela/get-booking-service-staff-rela",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: formData.branch,
            _ServiceId: serviceId,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Parse the staff assignments data
      let staffData = data.value;
      if (typeof staffData === "string") {
        staffData = JSON.parse(staffData || "[]");
      }

      setStaffAssignments(staffData || []);
      setCurrentStep(3);
    } catch (error: any) {
      console.error("❌ Error fetching staff assignments:", error);
      showAlert(
        "Failed to Load Staff Assignments",
        error.message || "Please try selecting a different service.",
        "destructive"
      );
    } finally {
      setLoading((prev) => ({ ...prev, staffAssignments: false }));
    }
  };

  // Fetch customers if user is global-admin or admin
  useEffect(() => {
    const fetchCustomers = async () => {
      // Skip if role hasn't been determined yet
      if (!userRole || (userRole !== "global-admin" && userRole !== "admin"))
        return;

      setLoading((prev) => ({ ...prev, customers: true }));
      try {
        const res = await fetch("/api/customer/get-customers");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${res.status}`
          );
        }

        const data = await res.json();

        // Parse customers data
        let customersData = data.value || [];
        if (typeof customersData === "string") {
          customersData = JSON.parse(customersData);
        }

        const customerOptions = customersData.map((customer: any) => ({
          id: customer.CustomerNo || customer.No || customer.id,
          customerNo: customer.CustomerNo || customer.No,
          name: customer.Name || customer.DisplayName,
          email: customer.EMail || customer.Email,
        }));

        setCustomers(customerOptions);
      } catch (error: any) {
        console.error("❌ Error fetching customers:", error);
        showAlert(
          "Failed to Load Customers",
          error.message || "Customer data could not be loaded.",
          "destructive"
        );
      } finally {
        setLoading((prev) => ({ ...prev, customers: false }));
      }
    };

    if (userRole === "global-admin" || userRole === "admin") {
      fetchCustomers();
    }
  }, [userRole]);

  // Fetch available time slots when all prerequisites are met
  const fetchAvailableTimeSlots = async () => {
    if (
      !formData.branch ||
      !formData.service ||
      !formData.staff ||
      !formData.date
    ) {
      setAvailableTimeSlots([]);
      return;
    }

    // Build parameter IDs and values for dynamic parameters
    const dynamicParameters = getDynamicParameters();
    const parameterIds = [
      "4",
      "5",
      ...dynamicParameters.map((p) => p.BookingParameterId.toString()),
    ].join("|");
    const parameterValues = [
      formData.service,
      formData.staff,
      ...dynamicParameters.map(
        (p) => formData[p.BookingParameterId.toString()] || ""
      ),
    ].join("|");

    setLoading((prev) => ({ ...prev, timeSlots: true }));

    try {
      const response = await fetch(
        "/api/available-timeslot/get-available-timeslot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: formData.branch,
            _BookingDate: formData.date,
            _BookingParameterCount: (2 + dynamicParameters.length).toString(),
            _BookingParameterIDs: parameterIds,
            _BookingParameterValueIDs: parameterValues,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch available time slots"
        );
      }

      const data = await response.json();

      // Data is already parsed by the API route
      const slotsData = data.value || [];
      setAvailableTimeSlots(slotsData);
    } catch (error: any) {
      console.error("❌ Error fetching time slots:", error);
      showAlert(
        "Failed to Load Time Slots",
        error.message || "Please try selecting a different date or time.",
        "destructive"
      );
      setAvailableTimeSlots([]);
    } finally {
      setLoading((prev) => ({ ...prev, timeSlots: false }));
    }
  };

  // Load time slots when date is selected and all prerequisites are met
  useEffect(() => {
    if (
      currentStep >= 4 &&
      formData.date &&
      formData.branch &&
      formData.service &&
      formData.staff
    ) {
      // Check if all dynamic parameters are selected
      const dynamicParameters = getDynamicParameters();
      const allDynamicSelected = dynamicParameters.every(
        (param) => formData[param.BookingParameterId.toString()]
      );

      if (allDynamicSelected) {
        fetchAvailableTimeSlots();
      }
    }
  }, [formData.date, currentStep]);

  const handleStepSelection = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-advance steps based on selection with correct sequence
    if (field === "branch" && value) {
      fetchBranchDetails(value);
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

      setStaffAssignments([]); // Clear previous staff assignments
      fetchStaffAssignments(value);
    } else if (field === "staff" && value && currentStep === 3) {
      // Stay on step 3 for dynamic parameters
    } else if (currentStep === 3) {
      // Check if this is a dynamic parameter field (numeric string)
      const dynamicParameters = getDynamicParameters();
      const isDynamicField = dynamicParameters.some(
        (param) => param.BookingParameterId.toString() === field
      );

      if (isDynamicField) {
        // Check if all dynamic parameters are filled to auto-advance
        const allDynamicSelected = dynamicParameters.every((param) => {
          const paramId = param.BookingParameterId.toString();
          // Use current value for the field being changed, otherwise use formData
          return paramId === field
            ? value
            : formData[paramId as keyof FormData];
        });

        if (allDynamicSelected) {
          setCurrentStep(4); // Move to date & time
        }
      }
    } else if (field === "date" && value && currentStep === 4) {
      // Stay on step 4 - don't auto-advance
    } else if (field === "selectedTime" && value && currentStep === 4) {
      setCurrentStep(5); // Move to customer
    }
  };

  const handleDynamicParameterChange = (
    parameterId: number,
    value: string
  ): void => {
    handleInputChange(parameterId.toString() as keyof FormData, value);
  };

  const handleTimeSlotClick = (time: string): void => {
    // Format time to ensure 2-digit hour (09:00 AM instead of 9:00 AM)
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

    // Auto-advance to customer step after selecting time
    setCurrentStep(5);
  };

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

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();

    // Validate all required fields including dynamic parameters
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

    setLoading((prev) => ({ ...prev, submitting: true }));

    try {
      // Build parameter IDs and values for dynamic parameters
      const parameterIds = [
        "4",
        "5",
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
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create booking");
      const result = await response.json();

      showAlert(
        "Booking Confirmed!",
        "Your appointment has been successfully scheduled."
      );

      // Reset form - use the same dynamicParameters variable
      const resetData: FormData = {
        branch: "",
        service: "",
        staff: "",
        date: "",
        selectedTime: "",
        customerNo: userRole === "admin" ? "" : customerNo,
        bookingNote: "",
      };

      // Reset dynamic parameters using the existing variable
      dynamicParameters.forEach((param) => {
        resetData[param.BookingParameterId.toString()] = "";
      });

      setFormData(resetData);
      setCurrentStep(1);
      setAvailableTimeSlots([]);
      setBookingSetup(null);
      setStaffAssignments([]);
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
      setLoading((prev) => ({ ...prev, submitting: false }));
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

  // Booking Summary Component
  const BookingSummaryCard = () => {
    const hasSummary = bookingSummary.branch || bookingSummary.service || bookingSummary.staff || bookingSummary.date;
    
    if (!hasSummary) return null;

    return (
      <Card className=" border-blue-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900 flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingSummary.branch && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Branch:</span>
              <span className="text-blue-900 text-right">
                {bookingSummary.branch.Description}
                <br />
                <span className="text-sm text-blue-600">{bookingSummary.branch.Location}</span>
              </span>
            </div>
          )}
          
          {bookingSummary.service && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Service:</span>
              <span className="text-blue-900 text-right">
                {bookingSummary.service.name}
                <br />
                <span className="text-sm text-blue-600">
                  {bookingSummary.service.duration} mins • {bookingSummary.service.code}
                </span>
              </span>
            </div>
          )}
          
          {bookingSummary.staff && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Staff:</span>
              <span className="text-blue-900 text-right">
                {bookingSummary.staff.name}
                <br />
                <span className="text-sm text-blue-600">ID: {bookingSummary.staff.code}</span>
              </span>
            </div>
          )}
          
          {bookingSummary.dynamicParameters.length > 0 && (
            <div>
              <span className="text-blue-700 font-medium block mb-1">Options:</span>
              <div className="space-y-1">
                {bookingSummary.dynamicParameters.map((param, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-blue-600 text-sm">{param.parameterName}:</span>
                    <span className="text-blue-900 text-sm">{param.valueName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {bookingSummary.date && (
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Date:</span>
              <span className="text-blue-900">
                {new Date(bookingSummary.date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {bookingSummary.time && (
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Time:</span>
              <span className="text-blue-900">{bookingSummary.time}</span>
            </div>
          )}
          
          {bookingSummary.customer && (
            <div className="flex justify-between items-start">
              <span className="text-blue-700 font-medium">Customer:</span>
              <span className="text-blue-900 text-right">
                {bookingSummary.customer.name}
                <br />
                <span className="text-sm text-blue-600">ID: {bookingSummary.customer.customerNo}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
                <div className="font-semibold text-blue-900">
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
            disabled={loading.submitting}
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
                  <CardTitle className="text-blue-900">Step 1: Choose Your Branch</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading.branches ? (
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
                            className="mt-1 text-blue-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-semibold text-blue-900">
                              {branch.Description}
                            </div>
                            <div className="text-sm text-blue-600">
                              {branch.Location} • ID: {branch.Code}
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
                  <CardTitle className="text-blue-900">Step 2: Select Service</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading.branchDetails ? (
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
                            <div className="font-medium text-blue-900">
                              {service.BookingParamterValueDescription}
                            </div>
                            <div className="text-sm text-blue-600">
                              {service.BookingParameterValueDuration} mins •{" "}
                              {service.BookingParameterValueCode}
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
                  <CardTitle className="text-blue-900">Step 3: Select Staff & Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Staff Selection */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-blue-900">Select Staff</h3>
                  {loading.staffAssignments ? (
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
                              <div className="font-medium text-blue-900">{staff.StaffName}</div>
                              <div className="text-sm text-blue-600">
                                ID: {staff.StaffCode}
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
                    <Separator className="bg-blue-200" />
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-900">
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
                                      <div className="font-medium text-blue-900">
                                        {value.BookingParamterValueDescription}
                                      </div>
                                      <div className="text-sm text-blue-600">
                                        {value.BookingParameterValueCode}
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
                  <CardTitle className="text-blue-900">Step 4: Select Date & Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date Selection - Left Side */}
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="booking-date"
                        className="text-base font-medium mb-2 block text-blue-900"
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
                              <div className="text-2xl font-bold text-blue-900">
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
                      <Label className="text-base font-medium block text-blue-900">
                        Available Time Slots
                      </Label>

                      {loading.timeSlots ? (
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
                    <CardTitle className="text-blue-900">
                      {userRole === "global-admin" || userRole === "admin"
                        ? "Step 5: Select Customer"
                        : "Step 5: Your Information"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {userRole === "global-admin" || userRole === "admin" ? (
                    <>
                      {loading.customers ? (
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
                                  <span className="font-medium text-blue-900">
                                    {customer.name}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    ID: {customer.customerNo}
                                    {customer.email && ` • ${customer.email}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {customers.length === 0 && !loading.customers && (
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
                      className="bg-blue-50 text-base font-semibold text-blue-900 border-blue-200"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Booking Note and Submit */}
              <Card className="border-blue-200">
                <CardHeader className=" border-b border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-blue-900">Special Notes (Optional)</CardTitle>
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
                      loading.submitting ||
                      !formData.selectedTime ||
                      !formData.customerNo
                    }
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {loading.submitting ? (
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