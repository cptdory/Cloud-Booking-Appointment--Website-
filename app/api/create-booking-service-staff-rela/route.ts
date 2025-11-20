import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { _BookingSetupCode, _BookingParameterId_Staff, _ServiceId, _StaffId, _StaffCode } = body;

    if (!_BookingSetupCode || !_BookingParameterId_Staff || !_ServiceId || !_StaffId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Call Business Central endpoint
    const bcRes = await fetch(
      "https://api.businesscentral.dynamics.com/v2.0/YOUR-ENV-ID/SandboxDev2/ODataV4/BookingAppointment_CreateAssignServiceStaff?Company=SQUADLETHICS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BC_API_TOKEN}`,
        },
        body: JSON.stringify({ _BookingSetupCode, _BookingParameterId_Staff, _ServiceId, _StaffId, _StaffCode }),
      }
    );

    const data = await bcRes.json();
    if (!bcRes.ok) {
      return NextResponse.json({ message: data?.error?.message || "Failed to assign service" }, { status: bcRes.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err.message || "Internal server error" }, { status: 500 });
  }
}
