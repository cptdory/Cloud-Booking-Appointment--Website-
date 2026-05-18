import { NextResponse } from "next/server";
import { entryStaffTimeoff } from "@/services/business-central/booking-entry-staff-timeoff.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received request body:", body); // Debug log
    const { bookingEntryNo } = body;

    const result = await entryStaffTimeoff.deleteBookingEntryStaffTimeOff(bookingEntryNo);
    // const parsed = JSON.parse(result?.value || "");
    return NextResponse.json({
      success: true,
      message: result?.value,
    });
  } catch (err: any) {
    console.error(
      "BC ERROR:",
      JSON.stringify(err?.response?.data, null, 2)
    );
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to delete timeoff",
      },
      { status: err?.response?.status || 500 }
    );
  }
}