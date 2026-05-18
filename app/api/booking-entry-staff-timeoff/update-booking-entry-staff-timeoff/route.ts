import { NextResponse } from "next/server";
import { entryStaffTimeoff } from "@/services/business-central/booking-entry-staff-timeoff.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            bookingSetupCode,
            staffCode,
            staffName,
            timeOffDate,
            timeOffStartTime,
            timeOffEndTime,
            wholeDay,
            timeOffReason,
            bookingEntryNo
        } = body;

        const result = await entryStaffTimeoff.updateBookingEntryStaffTimeOff(
            bookingSetupCode,
            staffCode,
            staffName,
            timeOffDate,
            timeOffStartTime,
            timeOffEndTime,
            wholeDay,
            timeOffReason,
            bookingEntryNo);
        const parsed = JSON.parse(result?.value || "null");

        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {
                error:
                    err?.response?.data?.error?.message ||
                    "Failed to update booking user password",
            },
            { status: err?.response?.status || 500 }
        );
    }
}