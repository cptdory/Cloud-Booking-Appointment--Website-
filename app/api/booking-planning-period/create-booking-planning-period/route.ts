// api/booking-planning-period/create-booking-planning-period
import { NextResponse } from "next/server";
import { bookingPlanningPeriodService } from "@/services/business-central/booking-planning-period.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received body:", JSON.stringify(body, null, 2));
        const { bookingSetupCode, code, description,dateFrom,dateTo } = body;
        const result = await bookingPlanningPeriodService.createBookingPlanningPeriod(bookingSetupCode, code,description,dateFrom,dateTo);
        const parsed = JSON.parse(result?.value || "null");
        return NextResponse.json(parsed);
    } catch (err: any) {
                                  console.error(
          "BC ERROR:",
          JSON.stringify(err?.response?.data, null, 2)
        );
        return NextResponse.json(
            { error: err?.response?.data?.error?.message || "Failed to create booking planning period", },
            { status: err?.response?.status || 500 }
        );
    }
}