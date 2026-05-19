// api/business-hours/get-booking-business-hour
import { NextResponse } from "next/server";
import { bookingBusinessHoursService } from "@/services/business-central/booking-business-hours.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request for earliest business start time with body:", body);
        const { branchCode, } = body;
        const result = await bookingBusinessHoursService.GetBookingEarliestBusinessStartTime(branchCode);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        // console.error(
        //     "BC ERROR:",
        //     JSON.stringify(err?.response?.data, null, 2)
        // );
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get business hours", },
            { status: err?.response?.status || 500 }
        );
    }
}