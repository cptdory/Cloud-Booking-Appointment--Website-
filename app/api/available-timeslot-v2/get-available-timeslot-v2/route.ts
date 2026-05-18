// api/available-timeslot/get-available-timeslot-v2
import { NextResponse } from "next/server";
import { availableTimeslotServiceV2 } from "@/services/business-central/available-timeslot.service-v2";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // console.log("Received request with body:", body);
        const { branchCode, bookingDate, serviceId, staffId } = body;
        const result = await availableTimeslotServiceV2.getAvailableTimeslotV2(branchCode, bookingDate, serviceId, staffId ?? '');
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get booking entries", },
            { status: err?.response?.status || 500 }
        );
    }
}