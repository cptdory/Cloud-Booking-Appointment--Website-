import ScrollUp from "@/components/Common/ScrollUp";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookufy",
  description: "",
  // other metadata
};

export default function Home() {
  return (
    <>
      <Header />
      <ScrollUp />
      <Hero />
      <Footer />
    </>
  );
}
