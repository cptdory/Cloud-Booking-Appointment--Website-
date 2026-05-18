// api/business-hours/delete-booking-business-hour
import { NextResponse } from "next/server";
import { bookingBusinessHoursService } from "@/services/business-central/booking-business-hours.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode,bookingBusinessHoursDayOfWeek, } = body;
        const result = await bookingBusinessHoursService.deleteBookingBusinessHour(bookingSetupCode,bookingBusinessHoursDayOfWeek,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get booking entries", },
            { status: err?.response?.status || 500 }
        );
    }
}