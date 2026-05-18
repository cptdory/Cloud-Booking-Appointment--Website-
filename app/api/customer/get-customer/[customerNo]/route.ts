import { NextResponse } from "next/server";
import { customerService } from "@/services/business-central/customer.service";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      customerNo: string;
    }>;
  }
) {
  try {
    const { customerNo } = await context.params;

    const result =await customerService.getCustomer(customerNo);

    const parsed = JSON.parse(result?.value || "[]");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          "Failed to fetch customer",
      },
      {
        status: err?.response?.status || 500,
      }
    );
  }
}