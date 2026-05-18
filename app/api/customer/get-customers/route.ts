import { NextResponse } from "next/server";
import { customerService } from "@/services/business-central/customer.service";

export async function GET() {
  try {
    const result = await customerService.getCustomers();

    const parsed = JSON.parse(result?.value);

    return NextResponse.json(parsed ?? []);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch customers",
      },
      { status: err?.response?.status || 500 }
    );
  }
}