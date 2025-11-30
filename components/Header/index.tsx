"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

import { Button } from "@/components/ui/button";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";

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
            src="/images/logo/logo-1.svg"
            alt="Logo"
            width={140}
            height={40}
            className="dark:hidden"
          />
          <Image
            src="/images/logo/logo-1.svg"
            alt="Logo"
            width={140}
            height={40}
            className="hidden dark:block"
          />
        </Link>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {menuData.map((item, idx) =>
              item.path ? (
                <NavigationMenuItem key={idx}>
                  <NavigationMenuLink
                    href={item.path}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      pathname === item.path
                        ? "text-blue-600 font-semibold"
                        : "text-blue-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
                    }`}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/signin">
            <Button
              variant="ghost"
              className="text-blue-800 hover:text-blue-600 hover:bg-blue-50 dark:text-white dark:hover:bg-gray-800"
            >
              Sign In
            </Button>
          </Link>

          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Sign Up
            </Button>
          </Link>

          <ThemeToggler />
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="px-3 py-2 border-blue-300 text-blue-800 dark:border-gray-600 dark:text-white"
              >
                ☰
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[260px] px-6 py-6 bg-white dark:bg-gray-900 border-l border-blue-200 dark:border-gray-700"
            >
              <div className="flex flex-col gap-6 mt-4">

                {/* Nav Links */}
                <div className="flex flex-col gap-4">
                  {menuData.map(
                    (item, idx) =>
                      item.path && (
                        <Link
                          key={idx}
                          href={item.path}
                          className={`text-lg font-medium ${
                            pathname === item.path
                              ? "text-blue-600 font-semibold"
                              : "text-blue-800 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
                          }`}
                        >
                          {item.title}
                        </Link>
                      )
                  )}
                </div>

                {/* Auth Buttons */}
                <div className="flex flex-col gap-3 pt-2 border-t border-blue-100 dark:border-gray-700">
                  <Link href="/signin">
                    <Button
                      variant="ghost"
                      className="w-full text-blue-800 hover:text-blue-600 hover:bg-blue-50 dark:text-white dark:hover:bg-gray-800"
                    >
                      Sign In
                    </Button>
                  </Link>

                  <Link href="/signup">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      Sign Up
                    </Button>
                  </Link>
                </div>

                {/* Theme Switcher */}
                <div className="pt-3 border-t border-blue-100 dark:border-gray-700">
                  <ThemeToggler />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
