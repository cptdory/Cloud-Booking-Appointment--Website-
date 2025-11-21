
"use client";
import AccountForm from "@/components/Account-Form/AccountForm";

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <AccountForm />
        </div>
      </div>
    </div>
  );
}
