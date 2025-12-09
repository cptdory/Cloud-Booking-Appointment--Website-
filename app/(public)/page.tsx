import ScrollUp from "@/components/Common/ScrollUp";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookufy – Online Booking & Appointment Scheduling System",
  description:
    "Bookufy is an easy-to-use online appointment scheduling and booking system for businesses. Manage bookings, clients, schedules, reminders, and more.",
  keywords: [
    "booking system",
    "appointment scheduling",
    "online booking",
    "saas booking",
    "business scheduling software",
    "Bookufy",
  ],

  // Canonical URL
  alternates: {
    canonical: "https://bookufy.com/",
  },

  // OpenGraph (Facebook, LinkedIn, etc.)
  openGraph: {
    title: "Bookufy – Online Booking & Appointment Scheduling System",
    description:
      "Manage your bookings, schedules, and appointments effortlessly using Bookufy.",
    url: "https://bookufy.com/",
    type: "website",
    siteName: "Bookufy",
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
      <ScrollUp />
      <Hero />
      <Footer />
    </>
  );
}
