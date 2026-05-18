import { NextResponse } from "next/server";
import { staffTimeoff } from "@/services/business-central/booking-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, day, fromTime } = body;
        const result = await staffTimeoff.deleteBookingStaffTimeoff(bookingSetupCode, bookingParameterId, bookingParameterValueId, day, fromTime);
        // const parsed = JSON.parse(result?.value || "");
        return NextResponse.json({
            success: true,
            message: result?.value,
        });
    } catch (err: any) {
        //console.error("BC ERROR:",JSON.stringify(err?.response?.data, null, 2));
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to delete timeoff", },
            { status: err?.response?.status || 500 }
        );
    }
}