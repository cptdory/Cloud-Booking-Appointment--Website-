"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnavailablePageContent() {
  const searchParams = useSearchParams();
  const desc = searchParams.get("desc") || "This page is unavailable.";
  return (
    <ErrorPage
      title="Page Unavailable"
      description={desc}
      showGoBack
      showContactAdmin
      contactAdminEmail="admin@example.com"
    />
  );
}

export default function UnavailablePage() {
  return (
    <Suspense>
      <UnavailablePageContent />
    </Suspense>
  );
}
