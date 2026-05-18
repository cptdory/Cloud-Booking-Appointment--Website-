// api/booking-parameter/create-booking-parameter
import { NextResponse } from "next/server";
import { bookingParameterService } from "@/services/business-central/booking-parameter.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const { bookingSetupCode, bookingParameterId, bookingParameterValueCode, bookingParameterValueDesc, bookingParameterValueDuration, bookingParameterValueStaff, bookingParameterValueService,bookingParameterValueServicePrice, bookingParameterValueServiceSequence } = body;
        const result = await bookingParameterService.createBookingParameterValue(bookingSetupCode, bookingParameterId, bookingParameterValueCode, bookingParameterValueDesc, bookingParameterValueDuration, bookingParameterValueStaff, bookingParameterValueService, bookingParameterValueServicePrice, bookingParameterValueServiceSequence);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to create", },
            { status: err?.response?.status || 500 }
        );
    }
}