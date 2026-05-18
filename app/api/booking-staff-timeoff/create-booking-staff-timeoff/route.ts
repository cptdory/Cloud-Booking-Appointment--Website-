import { NextResponse } from "next/server";
import { staffTimeoff } from "@/services/business-central/booking-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, staffCode, staffName, day, fromTime, toTime, wholeDay } = body;
        const result = await staffTimeoff.createBookingStaffTimeoff(bookingSetupCode, bookingParameterId, bookingParameterValueId, staffCode, staffName, day, fromTime, toTime, wholeDay);
        const parsed = JSON.parse(result?.value || "");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to create timeoff", },
            { status: err?.response?.status || 500 }
        );
    }
}