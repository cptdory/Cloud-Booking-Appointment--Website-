"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  FaEye,
  FaEyeSlash,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa";
import { sileo } from "sileo";

function SocialIcon({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-accent"
    >
      {icon}
    </a>
  );
}

const toImg = (img?: string) =>
  img?.startsWith("data:image")
    ? img
    : `data:image/png;base64,${img || ""}`;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── OTP Dialog ──────────────────────────────────────────────────────────────
function OtpDialog({
  open,
  email,
  loading,
  timeRemaining,
  canResend,
  onVerify,
  onResend,
  onClose,
}: {
  open: boolean;
  email: string;
  loading: boolean;
  timeRemaining: number;
  canResend: boolean;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const progress = timeRemaining > 0
    ? (timeRemaining / (Math.ceil(timeRemaining / 60) * 60)) * 100
    : 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Timer bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-1 bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-7">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Enter verification code
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a one-time code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
              One-time password
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={8}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm tracking-[0.3em] font-mono transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="······"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && !loading && onVerify(otp)}
            />
          </div>

          {/* Timer */}
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs font-medium tabular-nums ${
                timeRemaining <= 30 && timeRemaining > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {timeRemaining > 0 ? (
                <>Code expires in {formatTime(timeRemaining)}</>
              ) : (
                <span className="text-destructive">Code expired</span>
              )}
            </span>

            {/* Resend */}
            <button
              type="button"
              onClick={onResend}
              disabled={!canResend}
              className="text-xs font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Resend code
            </button>
          </div>

          {/* Verify button */}
          <button
            onClick={() => onVerify(otp)}
            disabled={loading || !otp || timeRemaining === 0}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Verifying…
              </span>
            ) : (
              "Verify & sign in"
            )}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LoginCustomerPage() {
  const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [requestId, setRequestId] = useState("");
  const [verificationType] = useState("Login Verification");

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [headline, setHeadline] = useState("");
  const [loginImage, setLoginImage] = useState("");

  const [facebookLink, setFacebookLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");

  const [otpValidityPeriod, setOtpValidityPeriod] = useState(5);
  const [otpTimeRemaining, setOtpTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const [orgLoading, setOrgLoading] = useState(true);

  // Fetch org
  useEffect(() => {
    if (!tenantId) return;

    const fetchOrg = async () => {
      try {
        const res = await fetch(
          `/api/booking-organization-setup?tenantId=${tenantId}`
        );
        const data = await res.json();

        setName(data?.Name ?? "");
        setLogo(data?.Logo ?? "");
        setHeadline(data?.Headline ?? "");
        setLoginImage(data?.CustomerPortalLoginImage ?? "");

        setFacebookLink(data?.FacebookLink ?? "");
        setTwitterLink(data?.TwitterLink ?? "");
        setYoutubeLink(data?.YoutubeLink ?? "");
        setLinkedinLink(data?.LinkedinLink ?? "");

        setOtpValidityPeriod(data?.OTPValidityPeriod ?? 5);
      } catch (err) {
        console.error(err);
        sileo.error({
          title: "Failed to load organization setup",
          fill: "#171717",
        });
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrg();
  }, [tenantId]);

  // Countdown timer
  useEffect(() => {
    if (!dialogOpen || otpTimeRemaining <= 0) return;

    setCanResend(false);

    const interval = setInterval(() => {
      setOtpTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          sileo.error({
            title: "OTP expired. Please resend.",
            fill: "#171717",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dialogOpen, otpTimeRemaining]);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const submitEmail = async () => {
    if (!email) {
      sileo.error({ title: "Email is required", fill: "#171717" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/one-time-password/otp-generation", {
        method: "POST",
        body: JSON.stringify({ emailAddress: email, verificationType:"Login Verification" }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!data) throw new Error("No request ID");

      setRequestId(String(data));
      setOtpTimeRemaining(otpValidityPeriod * 60);
      setCanResend(false);
      setDialogOpen(true);
    } catch (err: any) {
      console.error(err);
      sileo.error({
        title: err.message || "Failed to send OTP",
        fill: "#171717",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const resendOtp = async () => {
    setCanResend(false);
    setVerifyLoading(false);

    try {
      const res = await fetch("/api/one-time-password/otp-generation", {
        method: "POST",
        body: JSON.stringify({ emailAddress: email, verificationType }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!data) throw new Error("No request ID");

      setRequestId(String(data));
      setOtpTimeRemaining(otpValidityPeriod * 60);
      sileo.success({ title: "New code sent!", fill: "#171717" });
    } catch (err: any) {
      console.error(err);
      sileo.error({
        title: err.message || "Failed to resend OTP",
        fill: "#171717",
      });
      setCanResend(true);
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const submitOtp = async (otp: string) => {
    if (!otp) {
      sileo.error({ title: "OTP is required", fill: "#171717" });
      return;
    }

    setVerifyLoading(true);

    try {
      const res = await fetch("/api/one-time-password/otp-validation", {
        method: "POST",
        body: JSON.stringify({ requestId, otp }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data === true) {
        sileo.success({ title: "Login successful", fill: "#171717" });

        await fetch("/api/login-auth", {
          method: "POST",
          body: JSON.stringify({
            emailAddress: email,
            password: "placeholder",
            isUserLogin: "false",
            tenantId,
          }),
          headers: { "Content-Type": "application/json" },
        });

        window.location.href = "/book-now";
      } else {
        sileo.error({ title: "Invalid OTP", fill: "#171717" });
      }
    } catch (err: any) {
      console.error(err);
      sileo.error({
        title: err.message || "OTP verification failed",
        fill: "#171717",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const hasValue = (v: string) => v?.trim() !== "";

  return (
    <>
      {/* OTP Dialog */}
      <OtpDialog
        open={dialogOpen}
        email={email}
        loading={verifyLoading}
        timeRemaining={otpTimeRemaining}
        canResend={canResend}
        onVerify={submitOtp}
        onResend={resendOtp}
        onClose={() => setDialogOpen(false)}
      />

      <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
        <section className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:flex-row">

          {/* LEFT PANEL */}
          <div className="relative hidden md:flex md:w-[42%] flex-col items-center justify-between bg-primary p-8">

            {/* Grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.4) 24px,rgba(255,255,255,.4) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.4) 24px,rgba(255,255,255,.4) 25px)",
              }}
            />

            {/* Logo */}
            <div className="relative z-10 flex w-full items-center gap-3">
              {logo ? (
                <img
                  src={toImg(logo)}
                  alt={name}
                  className="h-10 w-28 rounded-lg object-contain bg-primary-foreground/10 px-1"
                />
              ) : (
                <div className="flex h-10 w-28 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground font-bold text-lg">
                  {name?.[0] ?? ""}
                </div>
              )}
            </div>

            {/* Login image */}
            <div className="relative z-10 w-full flex-1 flex items-center justify-center py-4">
              <div
                className="h-72 w-72 rounded-2xl border-2 border-primary-foreground/20 shadow-xl overflow-hidden bg-primary-foreground/10"
                style={
                  loginImage
                    ? {
                        backgroundImage: `url(${toImg(loginImage)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              />
            </div>

            {/* Tagline */}
            {headline && (
              <p className="relative z-10 text-center text-xs text-primary-foreground/70 leading-relaxed max-w-[220px]">
                {headline}
              </p>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="flex w-full flex-col justify-center p-8 md:p-10">

            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-3 md:hidden">
              {logo && (
                <img
                  src={toImg(logo)}
                  alt={name}
                  className="h-8 w-24 rounded-lg object-contain"
                />
              )}
              <span className="font-semibold text-foreground">{name}</span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email to receive a sign-in code
              </p>
            </div>

            {/* Email field */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                  Email address
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && submitEmail()}
                />
              </div>

              <button
                onClick={submitEmail}
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending code…
                  </span>
                ) : (
                  "Send verification code"
                )}
              </button>
            </div>

            {/* Socials */}
            {(hasValue(facebookLink) ||
              hasValue(twitterLink) ||
              hasValue(youtubeLink) ||
              hasValue(linkedinLink)) && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Follow {name}
                </p>
                <div className="flex gap-2">
                  {hasValue(facebookLink) && (
                    <SocialIcon label="Facebook" href={facebookLink} icon={<FaFacebook className="h-4 w-4" />} />
                  )}
                  {hasValue(twitterLink) && (
                    <SocialIcon label="Twitter" href={twitterLink} icon={<FaTwitter className="h-4 w-4" />} />
                  )}
                  {hasValue(youtubeLink) && (
                    <SocialIcon label="YouTube" href={youtubeLink} icon={<FaYoutube className="h-4 w-4" />} />
                  )}
                  {hasValue(linkedinLink) && (
                    <SocialIcon label="LinkedIn" href={linkedinLink} icon={<FaLinkedin className="h-4 w-4" />} />
                  )}
                </div>
              </div>
            )}

          </div>
        </section>
      </main>
    </>
  );
}