"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-black dark:to-gray-900">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Logo + Description */}
          <div>
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/images/logo/logo-2.svg"
                alt="logo"
                width={140}
                height={30}
                className="dark:hidden invert" // Invert logo for dark background
              />
              <Image
                src="/images/logo/logo-2.svg"
                alt="logo"
                width={140}
                height={30}
                className="hidden dark:block"
              />
            </Link>

            <p className="mt-4 text-sm text-gray-300 dark:text-gray-400">
              Streamline your appointment scheduling with our powerful booking system. 
              Efficient, reliable, and built to simplify your workflow.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex space-x-4 text-gray-400 dark:text-gray-500">
              {/* Facebook */}
              <Link href="/" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 22 22"
                  fill="currentColor"
                >
                  <path d="M12.1 10.4939V7.42705C12.1 6.23984 13.085 5.27741 14.3 5.27741H16.5V2.05296L13.5135 1.84452C10.9664 1.66676 8.8 3.63781 8.8 6.13287V10.4939H5.5V13.7183H8.8V20.1667H12.1V13.7183H15.4L16.5 10.4939H12.1Z" />
                </svg>
              </Link>

              {/* X / Twitter-like icon */}
              <Link href="/" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 22 22"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.9831 19.25L9.82094 13.3176L4.61058 19.25H2.40625L8.843 11.9233L2.40625 2.75H8.06572L11.9884 8.34127L16.9034 2.75H19.1077L12.9697 9.73737L19.6425 19.25H13.9831ZM16.4378 17.5775H14.9538L5.56249 4.42252H7.04674L10.808 9.6899L11.4584 10.6039L16.4378 17.5775Z"
                  />
                </svg>
              </Link>

              {/* YouTube */}
              <Link href="/" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                <svg width="18" height="14" viewBox="0 0 18 14" className="fill-current">
                  <path d="M17.5058 2.07119C17.3068 1.2488 16.7099 0.609173 15.9423 0.395963C14.5778 0 9.0627 0 9.0627 0C9.0627 0 3.54766 0 2.18311 0.395963C1.41555 0.609173 0.818561 1.2488 0.619565 2.07119C0.25 3.56366 0.25 6.60953 0.25 6.60953C0.25 6.60953 0.25 9.68585 0.619565 11.1479C0.818561 11.9703 1.41555 12.6099 2.18311 12.8231C3.54766 13.2191 9.0627 13.2191 9.0627 13.2191C9.0627 13.2191 14.5778 13.2191 15.9423 12.8231C16.7099 12.6099 17.3068 11.9703 17.5058 11.1479C17.8754 9.68585 17.8754 6.60953 17.8754 6.60953C17.8754 6.60953 17.8754 3.56366 17.5058 2.07119Z" />
                </svg>
              </Link>

              {/* LinkedIn */}
              <Link href="/" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                <svg width="17" height="16" viewBox="0 0 17 16" className="fill-current">
                  <path d="M15.2196 0H1.99991C1.37516 0 0.875366 0.497491 0.875366 1.11936V14.3029C0.875366 14.8999 1.37516 15.4222 1.99991 15.4222H15.1696C15.7943 15.4222 16.2941 14.9247 16.2941 14.3029V1.09448C16.3441 0.497491 15.8443 0 15.2196 0Z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white dark:text-gray-200">Useful Links</h3>
            <ul className="space-y-3 text-sm text-gray-400 dark:text-gray-500">
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/blog">
                  Blog
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/about">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Terms */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white dark:text-gray-200">Terms</h3>
            <ul className="space-y-3 text-sm text-gray-400 dark:text-gray-500">
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/">
                  TOS
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white dark:text-gray-200">Support & Help</h3>
            <ul className="space-y-3 text-sm text-gray-400 dark:text-gray-500">
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/contact">
                  Open Support Ticket
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link className="hover:text-white dark:hover:text-gray-300 font-medium transition-colors" href="/about">
                  About
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-gray-700 dark:border-gray-800 pt-6">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            © 2025 Cloudsteps Information Technology Solutions — All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}