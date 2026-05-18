// api/booking-planning-period/set-booking-planning-period-active
import { NextResponse } from "next/server";
import { bookingPlanningPeriodService } from "@/services/business-central/booking-planning-period.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, code } = body;
        const result = await bookingPlanningPeriodService.setBookingPlanningPeriodActive(bookingSetupCode, code);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to set booking planning period active", },
            { status: err?.response?.status || 500 }
        );
    }
}