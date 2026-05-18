import { NextResponse } from "next/server";
import { bookingEntryService } from "@/services/business-central/booking-entry.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { entryNo, bookingStatus} = body;
        const result = await bookingEntryService.updateBookingEntryStatus(entryNo, bookingStatus);
        const parsed = JSON.parse(result?.value || "null");

        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json(
            {
                error:
                    err?.response?.data?.error?.message ||
                    "Failed to get booking entries",
            },
            { status: err?.response?.status || 500 }
        );
    }
}