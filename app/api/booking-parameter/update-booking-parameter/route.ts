// api/booking-parameter/update-booking-parameter
import { NextResponse } from "next/server";
import { bookingParameterService } from "@/services/business-central/booking-parameter.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, bookingParameterId, bookingParameterValueId, bookingParameterValueCode, bookingParameterValueDesc, bookingParameterValueDuration, bookingParameterValueStaff, bookingParameterValueService,bookingParameterValueServicePrice, bookingParameterValueServiceSequence } = body;
        const result = await bookingParameterService.updateBookingParameterValue(bookingSetupCode, bookingParameterId, bookingParameterValueId, bookingParameterValueCode, bookingParameterValueDesc, bookingParameterValueDuration, bookingParameterValueStaff, bookingParameterValueService,bookingParameterValueServicePrice, bookingParameterValueServiceSequence);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
    //   console.error(
    //   "BC ERROR:",
    //   JSON.stringify(err?.response?.data, null, 2)
    // );
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to update", },
            { status: err?.response?.status || 500 }
        );
    }
}