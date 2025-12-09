import { Suspense } from "react";
import BookingForm from "@/components/Booking-Form/page";

export default function BookingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Suspense fallback={<div>Loading...</div>}>
            <BookingForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
