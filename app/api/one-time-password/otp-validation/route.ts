// api/one-time-password/otp-validation
import { NextResponse } from "next/server";
import { otpService } from "@/services/business-central/otp.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { requestId,otp } = body;
        const result = await otpService.otpValidation(requestId,otp);
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