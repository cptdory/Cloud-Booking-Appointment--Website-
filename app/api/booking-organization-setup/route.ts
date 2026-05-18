import { NextResponse } from "next/server";
import { organizationService } from "@/services/business-central/organization.service";

export async function GET(req: Request) {
  try {
    // const { searchParams } = new URL(req.url);
    const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const result = await organizationService.getBookingOrganizationSetup(tenantId);
    const parsed =JSON.parse(result?.value);

    return NextResponse.json(parsed?.[0] ?? null);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}