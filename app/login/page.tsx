"use client";

import { useEffect, useState } from "react";
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
import { api } from "@/lib/api";

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

const toImageSrc = (base64?: string) => {
  if (!base64) return "";
  if (base64.startsWith("data:image")) return base64;
  return `data:image/png;base64,${base64}`;
};

export default function LoginPage() {
  const tenantId = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

  const [emailAddress, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [headline, setHeadline] = useState("");
  const [loginImage, setLoginImage] = useState("");

  const [facebookLink, setFacebookLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [linkedinLink, setLinkedinLink] = useState("");

  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    if (tenantId) fetchOrg();
  }, [tenantId]);

  async function fetchOrg() {
    try {
      const { data } = await api.get("/booking-organization-setup", {
        params: { tenantId },
      });

      setName(data?.Name ?? "");
      setLogo(data?.Logo ?? "");
      setHeadline(data?.Headline ?? "");
      setLoginImage(data?.LoginImage ?? "");

      setFacebookLink(data?.FacebookLink ?? "");
      setTwitterLink(data?.TwitterLink ?? "");
      setYoutubeLink(data?.YoutubeLink ?? "");
      setLinkedinLink(data?.LinkedinLink ?? "");
    } catch (err: any) {
      console.error(err);
      sileo.error({
        title: "Failed to load organization setup",
        fill: "#171717",
      });
    } finally {
      setOrgLoading(false);
    }
  }

  async function submitLogin() {
    setLoading(true);

    try {
      const { data } = await api.post("/login-auth", {
        emailAddress,
        password,
        isUserLogin: "true",
        tenantId: tenantId,
      });

      sileo.success({ title: "Login successful!", fill: "#171717" });

      window.location.href = "/calendar";
    } catch (e: any) {
      const message = e?.response?.data?.error;

      sileo.error({
        title: message,
        fill: "#171717",
      });
    } finally {
      setLoading(false);
    }
  }

  const hasValue = (v: string) => v?.trim() !== "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">

      <section className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:flex-row">

        {/* LEFT PANEL — image / brand side */}
        <div className="relative hidden md:flex md:w-[42%] flex-col items-center justify-between bg-primary p-8">

          {/* Subtle grid texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,.4) 24px,rgba(255,255,255,.4) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,.4) 24px,rgba(255,255,255,.4) 25px)",
            }}
          />

          {/* Logo / brand mark — wide rectangle */}
          <div className="relative z-10 flex w-full items-center gap-3">
            {logo ? (
              <img
                src={toImageSrc(logo)}
                alt={name}
                className="h-10 w-28 rounded-lg object-contain bg-primary-foreground/10 px-1"
              />
            ) : (
              <div className="flex h-10 w-28 items-center justify-center rounded-lg bg-primary-foreground/20 text-primary-foreground font-bold text-lg">
                {name?.[0] ?? ""}
              </div>
            )}
          </div>

          {/* Login image — larger */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center py-4">
            <div
              className="h-72 w-72 rounded-2xl border-2 border-primary-foreground/20 shadow-xl overflow-hidden bg-primary-foreground/10"
              style={
                loginImage
                  ? {
                      backgroundImage: `url(${toImageSrc(loginImage)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
            />
          </div>

          {/* Tagline at bottom */}
          {headline && (
            <p className="relative z-10 text-center text-xs text-primary-foreground/70 leading-relaxed max-w-[220px]">
              {headline}
            </p>
          )}
        </div>

        {/* RIGHT PANEL — form */}
        <div className="flex w-full flex-col justify-center p-8 md:p-10">

          {/* Mobile: show logo + name */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            {logo && (
              <img
                src={toImageSrc(logo)}
                alt={name}
                className="h-10 w-28 rounded-lg object-contain bg-primary-foreground/10 px-1"
              />
            )}
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form fields */}
          <div className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-4 w-4" />
                  ) : (
                    <FaEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={submitLogin}
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
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
                  <SocialIcon
                    label="Facebook"
                    href={facebookLink}
                    icon={<FaFacebook className="h-4 w-4" />}
                  />
                )}
                {hasValue(twitterLink) && (
                  <SocialIcon
                    label="Twitter"
                    href={twitterLink}
                    icon={<FaTwitter className="h-4 w-4" />}
                  />
                )}
                {hasValue(youtubeLink) && (
                  <SocialIcon
                    label="YouTube"
                    href={youtubeLink}
                    icon={<FaYoutube className="h-4 w-4" />}
                  />
                )}
                {hasValue(linkedinLink) && (
                  <SocialIcon
                    label="LinkedIn"
                    href={linkedinLink}
                    icon={<FaLinkedin className="h-4 w-4" />}
                  />
                )}
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}