"use client";

import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

const BUSINESS_ID = "9903ED01-A73C-4874-8ABF-D2678E3AE23D";

export default function Welcome() {
  return (
    <main className="relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
      }}
    >

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full blur-3xl"
          style={{ background: "color-mix(in oklch, var(--primary) 10%, transparent)" }}
        />
        <div
          className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{ background: "color-mix(in oklch, var(--primary) 10%, transparent)" }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 md:px-10">

        {/* Nav */}
        <nav
          className="flex items-center justify-between border-b py-6"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-serif text-xl font-bold tracking-tight">
            Booku<span style={{ color: "var(--primary)" }}>fy</span>
          </span>

          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              border: "1px solid var(--border)",
              background: "var(--accent)",
              color: "var(--primary)",
            }}
          >
            <Sparkles className="h-3 w-3" />
            Booking Platform
          </span>
        </nav>

        {/* Hero */}
        <section className="py-24 md:py-32 text-center md:text-left">

          <p
            className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--primary)" }}
          >
            The smarter way to book
          </p>

          <h1 className="mx-auto max-w-3xl font-serif text-5xl font-bold leading-[1.08] md:text-7xl md:mx-0">
            Effortless bookings,{" "}
            <em style={{ color: "var(--primary)", fontStyle: "normal" }}>
              beautifully
            </em>{" "}
            organized.
          </h1>

          <p
            className="mt-6 mx-auto max-w-xl text-base font-light leading-relaxed md:text-lg md:mx-0"
            style={{ color: "var(--muted)" }}
          >
            Bookufy gives your team a single modern workspace — clean scheduling,
            unified customer records, and a login path that just works.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 md:flex-row md:justify-start">

            <Link
              href={`/login`}
              className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Staff Login
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href={`/login-customer`}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <Clock className="h-4 w-4" />
              Customer Login
            </Link>

          </div>
        </section>

        {/* Footer */}
        <footer
          className="flex flex-col items-center justify-between gap-3 border-t py-8 md:flex-row"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            © {new Date().getFullYear()} Bookufy. All rights reserved.
          </p>

          <div className="flex gap-5">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs font-medium transition hover:opacity-80"
                style={{ color: "var(--muted)" }}
              >
                {item}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </main>
  );
}