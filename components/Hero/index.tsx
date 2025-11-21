import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-16 pt-32 md:pb-32 md:pt-40 xl:pb-40 xl:pt-48 2xl:pb-48 2xl:pt-56">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Cloudsteps Booking Appointment System
          </h1>
          <p className="mb-10 text-base text-gray-600 dark:text-gray-300 sm:text-lg md:text-xl">
            A fast, reliable, and user-friendly platform designed to streamline appointment
            scheduling. Easily manage bookings, staff availability, and customer reservations—all
            in one place. Smart, efficient, and built to simplify your workflow.
          </p>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button asChild size="lg" className="px-8 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link href="/signup">Get Started</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <Link href="/about">About Us</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute right-0 top-0 -z-10 opacity-40 lg:opacity-100 pointer-events-none select-none">
        <div className="size-[450px] bg-blue-200 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 dark:bg-blue-900/30" />
      </div>

      <div className="absolute bottom-0 left-0 -z-10 opacity-40 lg:opacity-100 pointer-events-none select-none">
        <div className="size-[350px] bg-blue-100 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 dark:bg-blue-800/20" />
      </div>
    </section>
  );
}