// api/booking-parameter/delete-booking-parameter
import { NextResponse } from "next/server";
import { bookingParameterService } from "@/services/business-central/booking-parameter.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, } = body;
        const result = await bookingParameterService.deleteBookingParameterValue(bookingSetupCode, bookingParameterId, bookingParameterValueId,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to delete", },
            { status: err?.response?.status || 500 }
        );
    }
}