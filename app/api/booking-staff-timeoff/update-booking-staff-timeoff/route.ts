import { NextResponse } from "next/server";
import { staffTimeoff } from "@/services/business-central/booking-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request body:", body); // Debug log
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, staffCode, staffName, day, fromTime, toTime, wholeDay } = body;
        const result = await staffTimeoff.updateBookingStaffTimeoff(bookingSetupCode, bookingParameterId, bookingParameterValueId, staffCode, staffName, day, fromTime, toTime, wholeDay);
        const parsed = JSON.parse(result?.value || "");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to update timeoff", },
            { status: err?.response?.status || 500 }
        );
    }
}