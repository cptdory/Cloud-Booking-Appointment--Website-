// api/booking-staf-rela/get-booking-staff-rela 
import { NextResponse } from "next/server";
import { bookingStaffService } from "@/services/business-central/booking-staff-rela.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode,serviceId} = body;
        const result = await bookingStaffService.getBookingStaffRela(bookingSetupCode,serviceId);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get booking staff relation", },
            { status: err?.response?.status || 500 }
        );
    }
}