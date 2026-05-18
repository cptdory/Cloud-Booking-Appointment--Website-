import { NextResponse } from "next/server";
import { staffTimeoff } from "@/services/business-central/booking-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode,bookingParameterId,bookingParameterValueId } = body;
        const result = await staffTimeoff.getBookingStaffTimeoff(bookingSetupCode, bookingParameterId, bookingParameterValueId);
        const parsed = JSON.parse(result?.value || "");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {error: err?.response?.data?.error?.message || "Failed to get timeoff",},
            { status: err?.response?.status || 500 }
        );
    }
}