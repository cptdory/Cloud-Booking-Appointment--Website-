import { LoginForm } from "@/components/login-form";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Squadlethics",
  description:
    "Squadlethics is an easy-to-use online appointment scheduling and booking system for businesses. Manage bookings, clients, schedules, reminders, and more.",
  keywords: [
    "booking system",
    "appointment scheduling",
    "online booking",
    "saas booking",
    "business scheduling software",
    "Squadlethics",
  ],

  // Canonical URL
  alternates: {
    canonical: "https://squadlethics.com/",
  },

  // OpenGraph (Facebook, LinkedIn, etc.)
  openGraph: {
    title: "Squadlethics",
    description:
      "Manage your bookings, schedules, and appointments effortlessly using Squadlethics.",
    url: "https://squadlethics.com/",
    type: "website",
    siteName: "Squadlethics",
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
  },

  // Metadata for SEO robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Home() {
  return (
    <>
    <Header />
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </div>
      {/* SVG Mask - Updated with blue theme */}
      <div className="absolute bottom-0 left-0 z-[-1]">
        <svg
          width="239"
          height="601"
          viewBox="0 0 239 601"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            opacity="0.3"
            x="-184.451"
            y="600.973"
            width="196"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -184.451 600.973)"
            fill="url(#paint0_linear_93:235)"
          />
          <rect
            opacity="0.3"
            x="-188.201"
            y="385.272"
            width="59.7544"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -188.201 385.272)"
            fill="url(#paint1_linear_93:235)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_93:235"
              x1="-90.1184"
              y1="420.414"
              x2="-90.1184"
              y2="1131.65"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_93:235"
              x1="-159.441"
              y1="204.714"
              x2="-159.441"
              y2="915.952"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <Footer />
    </>
  );
}
