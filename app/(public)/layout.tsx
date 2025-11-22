import ScrollToTop from "@/components/ScrollToTop";

export default function PublicLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-screen">
      {children}
      <ScrollToTop />
    </div>
  );
}