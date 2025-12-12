"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full z-50 transition-all ${
        sticky
          ? "fixed bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-200 dark:bg-gray-900/90 dark:border-gray-700"
          : "absolute bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo/squadlethics-logo.svg"
            alt="Logo"
            width={140}
            height={40}
            className="dark:hidden"
          />
          <Image
            src="/images/logo/squadlethics-logo.svg"
            alt="Logo"
            width={140}
            height={40}
            className="hidden dark:block"
          />
        </Link>
        <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
          A doctor-led Physical Therapy clinic designed for injury prevention and multidisciplinary approach for rehabilitation.
        </p>

      </div>
    </header>
  );
}
