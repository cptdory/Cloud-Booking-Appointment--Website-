// api/booking-planning-period/get-booking-planning-period
import { NextResponse } from "next/server";
import { bookingPlanningPeriodService } from "@/services/business-central/booking-planning-period.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode } = body;
        const result = await bookingPlanningPeriodService.getBookingPlanningPeriod(bookingSetupCode);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {error:err?.response?.data?.error?.message ||"Failed to get booking planning periods",},
            { status: err?.response?.status || 500 }
        );
    }
}