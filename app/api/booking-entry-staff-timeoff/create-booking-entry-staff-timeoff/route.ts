import { NextResponse } from "next/server";
import { entryStaffTimeoff } from "@/services/business-central/booking-entry-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
    
        const {
            bookingSetupCode,
            staffCode,
            staffName,
            timeOffStartDate,
            timeOffEndDate,
            timeOffStartTime,
            timeOffEndTime,
            wholeDay,
            timeOffReason
        } = body;

        const result = await entryStaffTimeoff.createBookingEntryStaffTimeOff(
            bookingSetupCode,
            staffCode,
            staffName,
            timeOffStartDate,
            timeOffEndDate,
            timeOffStartTime,
            timeOffEndTime,
            wholeDay,
            timeOffReason);
        const parsed = JSON.parse(result?.value || "null");

        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {
                error:
                    err?.response?.data?.error?.message ||
                    "Failed to create timeoff",
            },
            { status: err?.response?.status || 500 }
        );
    }
}