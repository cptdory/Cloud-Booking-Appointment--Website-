import BookingCalendar from "@/components/Booking-Calendar/page";
import { Suspense } from "react";

function CalendarLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading calendar...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function CalendarPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Suspense fallback={<CalendarLoading />}>
            <BookingCalendar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}