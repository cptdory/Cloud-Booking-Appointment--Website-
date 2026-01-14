import { Inter } from "next/font/google";
import "../styles/index.css";
import { Providers } from "./providers";
import { OrgSetupProvider } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <OrgSetupProvider>
            {children}
          </OrgSetupProvider>
        </Providers>
      </body>
    </html>
  );
}