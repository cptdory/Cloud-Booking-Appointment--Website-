// api/available-timeslot/get-available-timeslot-v2
import { NextResponse } from "next/server";
import { availableTimeslotServiceV2 } from "@/services/business-central/available-timeslot.service-v2";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { branchCode, bookingDate, serviceId, staffId, isUserLogin } = body;
        const result = await availableTimeslotServiceV2.getAvailableTimeslotV2(branchCode, bookingDate, serviceId, staffId ?? '', isUserLogin);
        console.log("Received request with body:", result);
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