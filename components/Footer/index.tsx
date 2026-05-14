"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Youtube, Twitter, Linkedin } from "lucide-react";

import { useOrgSetup } from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Footer() {
  const { orgSetup } = useOrgSetup ? useOrgSetup() : { orgSetup: null };
  const logo = orgSetup?.Logo;
  const orgName = orgSetup?.Name;
  const FacebookLink = orgSetup?.FacebookLink;
  const TwitterLink = orgSetup?.TwitterLink;
  const YoutubeLink = orgSetup?.YoutubeLink;
  const LinkedinLink = orgSetup?.LinkedinLink;
  return (
    <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container py-2">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {orgSetup === null ? (
              <Skeleton className="w-[100px] h-[20px]" />
            ) : logo && logo.trim() !== "" ? (
              <>
                <Image
                  src={`data:image/png;base64,${logo}`}
                  alt="logo"
                  width={100}
                  height={20}
                  className="dark:hidden"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/logo/bookufy-logo.png";
                  }}
                />
                <Image
                  src={`data:image/png;base64,${logo}`}
                  alt="logo"
                  width={100}
                  height={20}
                  className="hidden dark:block"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/logo/bookufy-logo.png";
                  }}
                />
              </>
            ) : (
              <>
                <Image
                  src="/images/logo/bookufy-logo.png"
                  alt="Bookufy logo"
                  width={140}
                  height={30}
                  className="dark:hidden"
                />
                <Image
                  src="/images/logo/bookufy-logo.png"
                  alt="Bookufy logo"
                  width={140}
                  height={30}
                  className="hidden dark:block"
                />
              </>
            )}
          </Link>

          {/* Social Links */}
          <div className="flex space-x-6 text-gray-600 dark:text-gray-400">
            {FacebookLink && FacebookLink.trim() !== "" && (
              <Link target="_blank" href={FacebookLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Facebook size={20} />
              </Link>
            )}
            {YoutubeLink && YoutubeLink.trim() !== "" && (
              <Link target="_blank" href={YoutubeLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Youtube size={20} />
              </Link>
            )}
            {TwitterLink && TwitterLink.trim() !== "" && (
              <Link target="_blank" href={TwitterLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Twitter size={20} />
              </Link>
            )}
            {LinkedinLink && LinkedinLink.trim() !== "" && (
              <Link target="_blank" href={LinkedinLink} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Linkedin size={20} />
              </Link>
            )}
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} {orgName && orgName.trim() !== "" ? orgName : "Bookufy"}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}