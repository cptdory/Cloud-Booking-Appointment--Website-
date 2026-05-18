// api/booking-planning-period/update-booking-planning-period
import { NextResponse } from "next/server";
import { bookingPlanningPeriodService } from "@/services/business-central/booking-planning-period.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, code, description, dateFrom, dateTo } = body;
        const result = await bookingPlanningPeriodService.updateBookingPlanningPeriod(bookingSetupCode, code, description, dateFrom, dateTo);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to update booking planning period", },
            { status: err?.response?.status || 500 }
        );
    }
}