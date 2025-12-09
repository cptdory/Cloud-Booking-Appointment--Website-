"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Youtube, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/logo-1.svg"
              alt="Bookufy logo"
              width={140}
              height={30}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-1.svg"
              alt="Bookufy logo"
              width={140}
              height={30}
              className="hidden dark:block"
            />
          </Link>

          {/* Social Links */}
          <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
            {/* Facebook */}
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Facebook size={20} />
            </Link>

            {/* Twitter/X */}
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Twitter size={20} />
            </Link>

            {/* YouTube */}
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Youtube size={20} />
            </Link>

            {/* LinkedIn */}
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Linkedin size={20} />
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 Bookufy. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}