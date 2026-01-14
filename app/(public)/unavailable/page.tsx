"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { useSearchParams } from "next/navigation";

export default function UnavailablePage() {
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
