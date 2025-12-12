// components/otp-dialog.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface OTPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOTPVerified: () => void;
  onProceedWithBooking: (bookingData: any) => void;
  customerEmail: string;
  bookingData: any;
}

export function OTPDialog({
  isOpen,
  onClose,
  onOTPVerified,
  onProceedWithBooking,
  customerEmail,
  bookingData,
}: OTPDialogProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  // Use ref to track if OTP has been sent already
  const hasSentOTP = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Send OTP when dialog opens (only once)
  useEffect(() => {
    if (isOpen && !hasSentOTP.current) {
      console.log("Sending OTP (first time)");
      sendOTP();
      hasSentOTP.current = true;

      // Focus OTP input after a short delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
  }, [isOpen]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      hasSentOTP.current = false;
      setOtpSent(false);
      setOtp("");
      setRequestId(null);
      setError(null);
      setSuccess(null);
      setCountdown(0);
      setIsVerified(false);
      setVerifying(false);
      setLoading(false);
      setResending(false);
    }
  }, [isOpen]);

  const sendOTP = async (isResend = false) => {
    if (isResend) {
      setResending(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/one-time-password/otp-send-to-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _EmailAddress: customerEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result, "Failed to send OTP");
        return;
      }

      if (result.success && result.value) {
        setRequestId(result.value);
        setOtpSent(true);
        setCountdown(300); // 60 seconds countdown
        showSuccess(isResend ? "New OTP sent to your email!" : "OTP sent to your email!");
        
        // Focus OTP input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        showError(result, "Failed to send OTP");
      }
    } catch (err: any) {
      showError(err, "Failed to send OTP. Please try again.");
    } finally {
      if (isResend) {
        setResending(false);
      } else {
        setLoading(false);
      }
    }
  };

  const validateOTP = async () => {
    if (!otp || !requestId) {
      showInfo("Please enter the OTP");
      return;
    }

    if (otp.length < 4) {
      showInfo("Please enter a valid OTP (minimum 4 digits)");
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch("/api/one-time-password/otp-validation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _RequestId: requestId,
          _OTP: otp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result, "Failed to verify OTP");
        return;
      }

      if (result.success && result.isValid) {
        showSuccess("OTP verified successfully! Creating your booking...");
        setIsVerified(true);
        onOTPVerified();
        
        // Immediately proceed with booking
        setTimeout(() => {
          handleProceedWithBooking();
        }, 500);
        
      } else {
        showInfo("Invalid OTP. Please try again.");
        // Clear OTP on error
        setOtp("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err: any) {
      showError(err, "Failed to verify OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleProceedWithBooking = () => {
    console.log("Proceeding with booking:", bookingData);
    onProceedWithBooking(bookingData);
    
    // Close dialog after a short delay
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    
    setResending(true);
    setOtp("");
    setError(null);
    sendOTP(true);
  };

  const handleClose = () => {
    setOtp("");
    setRequestId(null);
    setError(null);
    setSuccess(null);
    setOtpSent(false);
    setCountdown(0);
    setIsVerified(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && otp.length >= 4 && !verifying) {
      validateOTP();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We've sent a One-Time Password (OTP) to{" "}
            <span className="font-medium text-blue-700">{customerEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!isVerified ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="otp"
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp(value);
                      if (error) setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg font-mono tracking-widest"
                    disabled={verifying || !otpSent || loading || isVerified}
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={resending || loading || countdown > 0 || isVerified}
                  className="gap-2"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend OTP
                  {countdown > 0 && ` (${countdown}s)`}
                </Button>
                
                {otpSent && !isVerified && (
                  <div className="text-sm text-blue-600">
                    OTP expires in {Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
              <p className="text-center font-medium text-green-700">
                OTP Verified Successfully!
              </p>
              <p className="text-center text-sm text-gray-600 mt-1">
                Your booking is being created...
              </p>
            </div>
          )}
        </div>

        {!isVerified ? (
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={verifying || loading || isVerified}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={validateOTP}
              disabled={verifying || !otp || otp.length < 4 || !otpSent || loading || isVerified}
              className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify OTP
                </>
              )}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <div className="w-full text-center">
              <Loader2 className="w-5 h-5 animate-spin inline-block mr-2 text-blue-600" />
              <span className="text-blue-600">Processing your booking...</span>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}