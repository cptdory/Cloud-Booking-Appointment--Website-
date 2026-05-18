// api/one-time-password/otp-generation
import { NextResponse } from "next/server";
import { otpService } from "@/services/business-central/otp.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { emailAddress,verificationType } = body;
        const result = await otpService.otpGeneration(emailAddress,verificationType);
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