import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 pt-32 md:pb-40 md:pt-48 xl:pb-56 xl:pt-64">
      <div className="container mx-auto px-4">
        {/* Main Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Smart Scheduling Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Appointment Booking
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>

          {/* Subheading */}
          <p className="mb-8 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Streamline your scheduling workflow with Bookufy. Manage appointments, staff availability,
            and customer reservations effortlessly—all in one intuitive platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="px-8 py-6 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/signup" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="px-8 py-6 text-base font-semibold border-2 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-all duration-300"
            >
              <Link href="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -top-40 right-0 -z-10 pointer-events-none select-none">
        <div className="size-[500px] bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-3xl opacity-30 dark:from-blue-900/20 dark:to-indigo-900/20 dark:opacity-20" />
      </div>

      <div className="absolute -bottom-40 left-0 -z-10 pointer-events-none select-none">
        <div className="size-[400px] bg-gradient-to-tr from-indigo-100 to-blue-100 rounded-full blur-3xl opacity-30 dark:from-indigo-900/20 dark:to-blue-900/20 dark:opacity-20" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }} />
      </div>
    </section>
  );
}