// api/booking-staf-rela/get-booking-staff-rela 
import { NextResponse } from "next/server";
import { bookingStaffService } from "@/services/business-central/booking-staff-rela.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { bookingSetupCode, serviceId, staffId, } = body;
        const result = await bookingStaffService.deleteBookingStaffRela(bookingSetupCode, serviceId, staffId,);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
                      console.error(
      "BC ERROR:",
      JSON.stringify(err?.response?.data, null, 2)
    );
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to get booking staff relation", },
            { status: err?.response?.status || 500 }
        );
    }
}