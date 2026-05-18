import { NextResponse } from "next/server";
import { customerService } from "@/services/business-central/customer.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      customerNo,
      name,
      phoneNo,
      email,
      address,
      address2,
      birthDate,
    } = body;

    const result = await customerService.updateCustomerDetails(
      customerNo,
      name,
      phoneNo,
      email,
      address,
      address2,
      birthDate
    );

    const parsed = JSON.parse(result?.value || "null");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to update customer",
      },
      { status: err?.response?.status || 500 }
    );
  }
}