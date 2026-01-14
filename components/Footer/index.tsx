"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Mail, Instagram, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container py-2">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/squadlethics-logo.svg"
              alt="Bookufy logo"
              width={140}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/squadlethics-logo.svg"
              alt="Bookufy logo"
              width={140}
              height={30}
              className="hidden dark:block"
            />
          </Link>

          {/* Social Links */}
          <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
            {/* Facebook */}
            <Link target="_blank" href="https://www.facebook.com/Squadlethicsph" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Facebook size={20} />
            </Link>

            {/* Email/X */}
            <Link href="mailto:win@squadlethics.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Mail size={20} />
            </Link>

            {/* Instagram */}
            <Link target="_blank" href="https://www.instagram.com/squadlethicsph/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Instagram size={20} />
            </Link>

            {/* Phone */}
            <Link href="tel:09606148364" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Phone size={20} />
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 Squadlethics. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}