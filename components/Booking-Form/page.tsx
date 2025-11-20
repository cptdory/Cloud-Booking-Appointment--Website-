"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Calendar, Clock, FileText, Users, Briefcase, DoorOpen, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

interface SelectOption {
  id: string;
  name: string;
}

interface AvailableTimeSlot {
  time: string;
  available: boolean;
}

export default function BookingForm() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState<string>("");
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [staff, setStaff] = useState<SelectOption[]>([]);
  const [rooms, setRooms] = useState<SelectOption[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [loading, setLoading] = useState({
    branches: false,
    branchDetails: false,
    timeSlots: false,
    submitting: false,
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

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/signin");
        } else {
          setUsername(data.user.name);
          setUserRole(data.user.role);
          setCustomerNo(data.user.customerNo);
        }
      })
      .catch(() => {
        router.replace("/signin");
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading((prev) => ({ ...prev, branches: true }));
      try {
        const res = await fetch("/api/booking/setup-list");
        if (!res.ok) throw new Error("Failed to fetch branches");
        const json = await res.json();

        const options = (json.value || []).map((b: any) => ({
          id: b.Code,
          name: b.Description || b.Code,
        }));

        setBranches(options);
      } catch (error) {
        console.error("Error fetching branches:", error);
        alert("Failed to load branches");
      } finally {
        setLoading((prev) => ({ ...prev, branches: false }));
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!formData.branch) {
        setServices([]);
        setStaff([]);
        setRooms([]);
        return;
      }

      setLoading((prev) => ({ ...prev, branchDetails: true }));

      try {
        const res = await fetch(`/api/booking/branch-details?code=${formData.branch}`);
        if (!res.ok) throw new Error("Failed to fetch branch details");

        const data = await res.json();

        setServices(data.services || []);
        setStaff(data.staff || []);
        setRooms(data.rooms || []);

        setFormData((prev) => ({
          ...prev,
          service: "",
          staff: "",
          room: "",
          selectedTime: "",
        }));
        setAvailableTimeSlots([]);
      } catch (error) {
        console.error("Error fetching branch details:", error);
        setServices([]);
        setStaff([]);
        setRooms([]);
      } finally {
        setLoading((prev) => ({ ...prev, branchDetails: false }));
      }
    };

    fetchBranchDetails();
  }, [formData.branch]);

  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!formData.branch || !formData.service || !formData.staff || !formData.room || !formData.date) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoading((prev) => ({ ...prev, timeSlots: true }));

      try {
        const response = await fetch("/api/booking/available-slots", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _BookingSetupCode: formData.branch,
            _BookingDate: formData.date,
            _BookingParameterCount: 3,
            _BookingParameterIDs: "4|5|6",
            _BookingParameterValueIDs: `${formData.service}|${formData.staff}|${formData.room}`,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch available time slots");

        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const slots = data.value.map((slot: any) => ({
            time: slot.time,
            available: slot.available,
          }));
          setAvailableTimeSlots(slots);
        } else {
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching time slots:", error);
        setAvailableTimeSlots([]);
      } finally {
        setLoading((prev) => ({ ...prev, timeSlots: false }));
      }
    };

    fetchAvailableTimeSlots();
  }, [formData.branch, formData.service, formData.staff, formData.room, formData.date]);

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeSlotClick = (time: string): void => {
    setFormData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    if (!formData.branch || !formData.service || !formData.staff || !formData.room || !formData.date || !formData.selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    setLoading((prev) => ({ ...prev, submitting: true }));

    try {
      const response = await fetch("/api/booking/book-slot", {
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

      console.log("Booking created:", result);
      alert("Booking confirmed successfully!");

      setFormData({
        branch: "",
        service: "",
        staff: "",
        room: "",
        date: "",
        selectedTime: "",
        customerNo: customerNo,
        bookingNote: "",
      });
      setAvailableTimeSlots([]);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleAdminPanel = (): void => {
    router.push("/admin");
  };

  useEffect(() => {
    if (customerNo) {
      setFormData((prev) => ({
        ...prev,
        customerNo: customerNo,
      }));
    }
  }, [customerNo]);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">


      {/* Step 1: Branch Selection */}
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
            <RadioGroup value={formData.branch} onValueChange={(value) => handleInputChange("branch", value)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <Label
                    key={branch.id}
                    htmlFor={`branch-${branch.id}`}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.branch === branch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={branch.id} id={`branch-${branch.id}`} className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold">{branch.name}</div>
                      <div className="text-sm text-muted-foreground">Branch ID: {branch.id}</div>
                    </div>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Service, Staff, Room Selection */}
      {formData.branch && (
        <>
          {/* Service Selection */}
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
                <RadioGroup value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <Label
                        key={service.id}
                        htmlFor={`service-${service.id}`}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.service === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={service.id} id={`service-${service.id}`} />
                        <span className="ml-3 font-medium">{service.name}</span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Staff and Room Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Select Staff</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading.branchDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading staff...</span>
                  </div>
                ) : staff.length === 0 ? (
                  <p className="text-muted-foreground">No staff available</p>
                ) : (
                  <RadioGroup value={formData.staff} onValueChange={(value) => handleInputChange("staff", value)}>
                    <div className="space-y-2">
                      {staff.map((member) => (
                        <Label
                          key={member.id}
                          htmlFor={`staff-${member.id}`}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.staff === member.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={member.id} id={`staff-${member.id}`} />
                          <span className="ml-3 font-medium">{member.name}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Room */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-primary" />
                  <CardTitle>Select Room</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading.branchDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading rooms...</span>
                  </div>
                ) : rooms.length === 0 ? (
                  <p className="text-muted-foreground">No rooms available</p>
                ) : (
                  <RadioGroup value={formData.room} onValueChange={(value) => handleInputChange("room", value)}>
                    <div className="space-y-2">
                      {rooms.map((room) => (
                        <Label
                          key={room.id}
                          htmlFor={`room-${room.id}`}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            formData.room === room.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={room.id} id={`room-${room.id}`} />
                          <span className="ml-3 font-medium">{room.name}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Date and Customer Number */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <CardTitle>Select Date</CardTitle>
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

            {/* Customer Number */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Your ID</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  value={formData.customerNo}
                  readOnly
                  className="bg-muted text-base font-semibold"
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Slots */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle>Select Time Slot</CardTitle>
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
                        key={`${slot.time}-${index}`}
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

          {/* Booking Note */}
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

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading.submitting || !formData.selectedTime}
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