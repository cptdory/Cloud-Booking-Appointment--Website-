"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";

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
    const handleScroll = () => {
      setSticky(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full z-50 transition-all ${
        sticky
          ? "fixed bg-white/80 dark:bg-gray-900 backdrop-blur-md shadow"
          : "absolute bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between py-4">
        
        {/* Logo */}
        <Link href="/">
          <Image
            src="/images/logo/logo-2.svg"
            alt="Logo"
            width={140}
            height={40}
            className="dark:hidden"
          />
          <Image
            src="/images/logo/logo-2.svg"
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
                        ? "text-blue-600"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600"
                    }`}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-4">

          <Link href="/signin">
            <Button variant="ghost" className="text-gray-700 dark:text-white">
              Sign In
            </Button>
          </Link>

          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign Up
            </Button>
          </Link>

          <ThemeToggler />
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="px-3 py-2">
                ☰
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[260px]">
              <div className="flex flex-col gap-6 mt-8">

                {menuData.map((item, idx) =>
                  item.path ? (
                    <Link
                      key={idx}
                      href={item.path}
                      className={`text-lg ${
                        pathname === item.path
                          ? "text-blue-600 font-semibold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.title}
                    </Link>
                  ) : null
                )}

                <Link href="/signin">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-800 dark:text-white"
                  >
                    Sign In
                  </Button>
                </Link>

                <Link href="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>

                <ThemeToggler />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
