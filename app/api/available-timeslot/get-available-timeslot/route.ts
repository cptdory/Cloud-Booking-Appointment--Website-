// api/available-timeslot/get-available-timeslot
import { NextResponse } from "next/server";
import { availableTimeslotService } from "@/services/business-central/available-timeslot.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode,
            bookingDate,
            bookingParameterCount,
            bookingParameterIDs,
            bookingParameterValueIDs,
            skipTimeSlotAvailabilityCheck, } = body;
        const result = await availableTimeslotService.getAvailableTimeslot(bookingSetupCode,
            bookingDate,
            bookingParameterCount,
            bookingParameterIDs,
            bookingParameterValueIDs,
            skipTimeSlotAvailabilityCheck,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {
                error:
                    err?.response?.data?.error?.message ||
                    "Failed to get booking entries",
            },
            { status: err?.response?.status || 500 }
        );
    }
}