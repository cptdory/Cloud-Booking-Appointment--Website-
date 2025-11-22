"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Loader2,
  Calendar,
  Clock,
  FileText,
  Users,
  Briefcase,
  DoorOpen,
  CheckCircle2,
  User,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface FormData {
  branch: string;
  service: string;
  staff: string;
  room: string;
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

interface BookingSetup {
  BookingSetupCode: string;
  BookingSetupDescription: string;
  BookingSetupTimeIncrement: number;
  BookingSetupAllowableTime: number;
  BookingParameter: {
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
  }[];
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

export default function BookingForm() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bookingSetup, setBookingSetup] = useState<BookingSetup | null>(null);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);

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
    room: "",
    date: "",
    selectedTime: "",
    customerNo: "",
    bookingNote: "",
  });

  const [checkingAuth, setCheckingAuth] = useState(true);

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
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("📦 Branches API response:", data);

        // Data is already parsed by API route
        const branchesData = data.value || [];
        setBranches(branchesData);

      } catch (error: any) {
        console.error("❌ Error fetching branches:", error);
        alert(`Failed to load branches: ${error.message}`);
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

      console.log("📦 Booking setup response:", data);

      // Parse the stringified JSON from API
      let setupData = data.value;
      if (typeof setupData === "string") {
        setupData = JSON.parse(setupData);
      }

      // Handle array response
      const finalData = Array.isArray(setupData) ? setupData[0] : setupData;
      console.log("✅ Parsed booking setup:", finalData);

      setBookingSetup(finalData);
      setCurrentStep(2);
    } catch (error) {
      console.error("❌ Error fetching branch details:", error);
      alert("Failed to load branch details");
    } finally {
      setLoading((prev) => ({ ...prev, branchDetails: false }));
    }
  };

  // Step 3: Fetch staff assignments when service is selected
  const fetchStaffAssignments = async (serviceId: string) => {
    setLoading((prev) => ({ ...prev, staffAssignments: true }));
    try {
      const res = await fetch("/api/booking-service-staff-rela/get-booking-service-staff-rela", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: formData.branch,
          _ServiceId: serviceId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("📦 Staff assignments response:", data);

      // Parse the staff assignments data
      let staffData = data.value;
      if (typeof staffData === "string") {
        staffData = JSON.parse(staffData || "[]");
      }

      console.log("👥 Parsed staff assignments:", staffData);
      setStaffAssignments(staffData || []);
      setCurrentStep(3);
    } catch (error: any) {
      console.error("❌ Error fetching staff assignments:", error);
      alert(`Failed to load staff assignments: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, staffAssignments: false }));
    }
  };

  // Fetch customers if user is admin
  useEffect(() => {
    const fetchCustomers = async () => {
      if (userRole !== "admin") return;
      
      setLoading((prev) => ({ ...prev, customers: true }));
      try {
        const res = await fetch("/api/customer/get-customers");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("📦 Customers response:", data);
        
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
        
        console.log("👥 Processed customers:", customerOptions);
        setCustomers(customerOptions);
      } catch (error: any) {
        console.error("❌ Error fetching customers:", error);
        alert(`Failed to load customers: ${error.message}`);
      } finally {
        setLoading((prev) => ({ ...prev, customers: false }));
      }
    };

    if (userRole === "admin") {
      fetchCustomers();
    }
  }, [userRole]);

  // Fetch available time slots when all prerequisites are met
  const fetchAvailableTimeSlots = async () => {
    if (!formData.branch || !formData.service || !formData.staff || !formData.room || !formData.date) {
      setAvailableTimeSlots([]);
      return;
    }

    setLoading((prev) => ({ ...prev, timeSlots: true }));

    try {
      const response = await fetch("/api/available-timeslot/get-available-timeslot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: formData.branch,
          _BookingDate: formData.date,
          _BookingParameterCount: "3",
          _BookingParameterIDs: "4|5|6",
          _BookingParameterValueIDs: `${formData.service}|${formData.staff}|${formData.room}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch available time slots");
      }
      
      const data = await response.json();
      console.log("📦 Available time slots response:", data);

      // Data is already parsed by the API route
      const slotsData = data.value || [];
      setAvailableTimeSlots(slotsData);
      
    } catch (error: any) {
      console.error("❌ Error fetching time slots:", error);
      alert(`Failed to load time slots: ${error.message}`);
      setAvailableTimeSlots([]);
    } finally {
      setLoading((prev) => ({ ...prev, timeSlots: false }));
    }
  };

  // Load time slots when date is selected and all prerequisites are met
  useEffect(() => {
    if (currentStep >= 6 && formData.date && formData.branch && formData.service && formData.staff && formData.room) {
      fetchAvailableTimeSlots();
    }
  }, [formData.date, currentStep]);

  const handleStepSelection = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      
      // Reset subsequent steps data
      const resetData: Partial<FormData> = {};
      if (step < 2) resetData.branch = "";
      if (step < 3) resetData.service = "";
      if (step < 4) resetData.staff = "";
      if (step < 5) resetData.room = "";
      if (step < 6) resetData.date = "";
      if (step < 7) {
        resetData.selectedTime = "";
        setAvailableTimeSlots([]);
      }
      
      setFormData(prev => ({ ...prev, ...resetData }));
      
      // Reset data states for subsequent steps
      if (step < 2) {
        setBookingSetup(null);
        setStaffAssignments([]);
      }
      if (step < 3) {
        setStaffAssignments([]);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-advance steps based on selection
    if (field === "branch" && value) {
      fetchBranchDetails(value);
    } else if (field === "service" && value && currentStep === 2) {
      // Reset staff when service changes
      setFormData((prev) => ({
        ...prev,
        staff: "", // Clear previous staff selection
        room: "", // Clear room selection as well
      }));
      setStaffAssignments([]); // Clear previous staff assignments
      fetchStaffAssignments(value);
    } else if (field === "staff" && value && currentStep === 3) {
      setCurrentStep(4); // Move to rooms
    } else if (field === "room" && value && currentStep === 4) {
      setCurrentStep(5); // Move to date
    } else if (field === "date" && value && currentStep === 5) {
      setCurrentStep(6); // Move to customer
    } else if (field === "customerNo" && value && currentStep === 6) {
      setCurrentStep(7); // Move to time slots
    }
  };

  const handleTimeSlotClick = (time: string): void => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    if (!formData.branch || !formData.service || !formData.staff || !formData.room || !formData.date || !formData.selectedTime || !formData.customerNo) {
      alert("Please fill in all fields");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));

    try {
      const response = await fetch("/api/available-timeslot/book-available-timeslot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _BookingSetupCode: formData.branch,
          _BookingDate: formData.date,
          _BookingStartTime: formData.selectedTime,
          _BookingParameterCount: 3,
          _BookingParameterIDs: "4|5|6",
          _BookingParameterValueIDs: `${formData.service}|${formData.staff}|${formData.room}`,
          _CustomerNo: formData.customerNo,
          _BookingNote: formData.bookingNote || "Booking from web app",
        }),
      });

      if (!response.ok) throw new Error("Failed to create booking");
      const result = await response.json();

      console.log("✅ Booking created:", result);
      alert("Booking confirmed successfully!");

      // Reset form
      setFormData({
        branch: "",
        service: "",
        staff: "",
        room: "",
        date: "",
        selectedTime: "",
        customerNo: userRole === "admin" ? "" : customerNo,
        bookingNote: "",
      });
      setCurrentStep(1);
      setAvailableTimeSlots([]);
      setBookingSetup(null);
      setStaffAssignments([]);
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Set customer number for non-admin users
  useEffect(() => {
    if (customerNo && userRole !== "admin" && currentStep >= 6) {
      setFormData((prev) => ({
        ...prev,
        customerNo: customerNo,
      }));
      setCurrentStep(7); // Auto-advance to time slots
    }
  }, [customerNo, userRole, currentStep]);

  // Get services from booking setup
  const services = bookingSetup?.BookingParameter?.find(
    param => param.BookingParameterService
  )?.BookingParameterValue || [];

  // Get rooms from booking setup  
  const rooms = bookingSetup?.BookingParameter?.find(
    param => !param.BookingParameterStaff && !param.BookingParameterService
  )?.BookingParameterValue || [];

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="container mx-auto p-6 max-w-6xl flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* User Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold">Welcome, {username || "User"}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={userRole === "admin" ? "default" : "secondary"}>
                    {userRole === "admin" ? "Administrator" : "Customer"}
                  </Badge>
                  {userRole !== "admin" && customerNo && (
                    <span>ID: {customerNo}</span>
                  )}
                </div>
              </div>
            </div>
            {userRole === "admin" && (
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Admin Panel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => handleStepSelection(step)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step
                      ? "bg-primary text-primary-foreground cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-default"
                  } ${step < currentStep ? "hover:bg-primary/90" : ""}`}
                >
                  {step}
                </button>
                {step < 7 && (
                  <ChevronRight
                    className={`w-4 h-4 mx-2 ${
                      currentStep > step ? "text-primary" : "text-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Branch</span>
            <span>Service</span>
            <span>Staff</span>
            <span>Room</span>
            <span>Date</span>
            <span>Customer</span>
            <span>Time</span>
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
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </Button>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 7
          </div>
        </div>
      )}

      {/* Step 1: Branch Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle>Step 1: Choose Your Branch</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading.branches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading branches...</span>
              </div>
            ) : branches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No branches available</p>
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
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={branch.Code}
                        id={`branch-${branch.Code}`}
                        className="mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-semibold">{branch.Description}</div>
                        <div className="text-sm text-muted-foreground">
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <CardTitle>Step 2: Select Service</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading.branchDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading services...</span>
              </div>
            ) : services.length === 0 ? (
              <p className="text-muted-foreground">No services available</p>
            ) : (
              <RadioGroup
                value={formData.service}
                onValueChange={(value) => handleInputChange("service", value)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <Label
                      key={service.BookingParameterValueId}
                      htmlFor={`service-${service.BookingParameterValueId}`}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.service === service.BookingParameterValueId.toString()
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={service.BookingParameterValueId.toString()}
                        id={`service-${service.BookingParameterValueId}`}
                      />
                      <div className="ml-3">
                        <div className="font-medium">{service.BookingParamterValueDescription}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.BookingParameterValueDuration} mins • {service.BookingParameterValueCode}
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

      {/* Step 3: Staff Selection */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Step 3: Select Staff</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading.staffAssignments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading staff...</span>
              </div>
            ) : staffAssignments.length === 0 ? (
              <p className="text-muted-foreground">No staff available for this service</p>
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
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={staff.StaffId.toString()}
                        id={`staff-${staff.StaffId}`}
                      />
                      <div className="ml-3">
                        <div className="font-medium">{staff.StaffName}</div>
                        <div className="text-sm text-muted-foreground">ID: {staff.StaffCode}</div>
                      </div>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Room Selection */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-primary" />
              <CardTitle>Step 4: Select Room</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <p className="text-muted-foreground">No rooms available</p>
            ) : (
              <RadioGroup
                value={formData.room}
                onValueChange={(value) => handleInputChange("room", value)}
              >
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <Label
                      key={room.BookingParameterValueId}
                      htmlFor={`room-${room.BookingParameterValueId}`}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.room === room.BookingParameterValueId.toString()
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={room.BookingParameterValueId.toString()}
                        id={`room-${room.BookingParameterValueId}`}
                      />
                      <div className="ml-3">
                        <div className="font-medium">{room.BookingParamterValueDescription}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.BookingParameterValueCode}
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

      {/* Step 5: Date Selection */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>Step 5: Select Date</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="text-base"
            />
          </CardContent>
        </Card>
      )}

      {/* Step 6: Customer Selection */}
      {currentStep === 6 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>
                {userRole === "admin" ? "Step 6: Select Customer" : "Step 6: Your Information"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {userRole === "admin" ? (
              <>
                {loading.customers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading customers...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.customerNo}
                    onValueChange={(value) => handleInputChange("customerNo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.customerNo}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground mt-2">No customers available</p>
                )}
              </>
            ) : (
              <Input
                type="text"
                value={formData.customerNo}
                readOnly
                className="bg-muted text-base font-semibold"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 7: Time Slots */}
      {currentStep === 7 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle>Step 7: Select Time Slot</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading.timeSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading available time slots...</span>
              </div>
            ) : (
              <>
                {availableTimeSlots.length > 0 && (
                  <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg text-sm">
                    <span>Total slots: <strong>{availableTimeSlots.length}</strong></span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-green-600">
                      Available: <strong>{availableTimeSlots.filter((slot) => slot.available).length}</strong>
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-destructive">
                      Booked: <strong>{availableTimeSlots.filter((slot) => !slot.available).length}</strong>
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {availableTimeSlots.map((slot, index) => (
                    <Button
                      key={`${slot.id}-${index}`}
                      type="button"
                      onClick={() => handleTimeSlotClick(slot.time)}
                      disabled={!slot.available}
                      variant={formData.selectedTime === slot.time ? "default" : "outline"}
                      className="min-w-[100px]"
                    >
                      {slot.time}
                      {!slot.available && " ✗"}
                    </Button>
                  ))}
                </div>

                {!formData.selectedTime && availableTimeSlots.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">Please select a time slot</p>
                )}
                {availableTimeSlots.length === 0 && formData.date && (
                  <p className="text-sm text-destructive mt-4">No available time slots for selected date</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Note and Submit */}
      {currentStep === 7 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Special Notes (Optional)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.bookingNote}
                onChange={(e) => handleInputChange("bookingNote", e.target.value)}
                rows={4}
                placeholder="Any special requirements or notes about your appointment..."
                className="resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading.submitting || !formData.selectedTime || !formData.customerNo}
                className="w-full h-12 text-base"
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
  );
}