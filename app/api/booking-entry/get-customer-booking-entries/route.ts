// api/booking-entry/get-customer-booking-entries
import { NextResponse } from "next/server";
import { bookingEntryService } from "@/services/business-central/booking-entry.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customerNo } = body;
        const result = await bookingEntryService.getCustomerBookingEntries(customerNo);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {error:err?.response?.data?.error?.message ||"Failed to get booking entries",},
            { status: err?.response?.status || 500 }
        );
    }
}