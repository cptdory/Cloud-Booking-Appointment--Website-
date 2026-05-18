// api/available-timeslot/book-available-timeslot
import { NextResponse } from "next/server";
import { availableTimeslotServiceV2 } from "@/services/business-central/available-timeslot.service-v2";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request with body:", body);
        const { branchCode,
            bookingDate,
            startTime,
            serviceId,
            staffid,
            bookingNote,
            bookingEntryNo,
            customerNoOrEmailAdd,
            customerName,
            customerPhoneNo,
            customerBirthDate,
            customerAddress1,
            customerAddress2,
            skipTimeSlotAvailabilityCheck, } = body;
        const result = await availableTimeslotServiceV2.bookAvailableTimeslotV2(branchCode,
            bookingDate,
            startTime,
            serviceId,
            staffid,
            bookingNote,
            bookingEntryNo,
            customerNoOrEmailAdd,
            customerName,
            customerPhoneNo,
            customerBirthDate,
            customerAddress1,
            customerAddress2,
            skipTimeSlotAvailabilityCheck,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        console.error("BC ERROR:", JSON.stringify(err?.response?.data, null, 2));
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get booking entries", },
            { status: err?.response?.status || 500 }
        );
    }
}