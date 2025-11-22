"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function BusinessInformation() {
  return (
    <div className="flex flex-col flex-1 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Cloudsteps Information Technology Solutions</h1>
        <p className="text-lg text-muted-foreground">
          Crafting masterpieces in digital transformation.       </p>
      </div>

      <Separator />

      {/* About Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">About Us</h2>
        <p className="text-base leading-relaxed mb-4">
          Cloudsteps Information Technology Solutions offers comprehensive accounting, management, and
          operational software solutions tailored for businesses across industries.       </p>
        <p className="text-base leading-relaxed">
          Our expertise is centered on Microsoft Dynamics 365 Business Central, delivering ERP solutions
          that integrate smoothly with existing systems.       </p>
      </Card>

      {/* Services Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Our Services</h2>
        <ul className="space-y-3 list-disc list-inside text-base">
          <li>
            <strong>ERP (Upgrades, Customization, Migration, and Support):</strong> Enhancing and
            customizing ERP systems to match business needs.         </li>
          <li>
            <strong>Systems Integration:</strong> Modernizing legacy systems and integrating applications
            for efficient operations.         </li>
          <li>
            <strong>Technical Consultation and Support:</strong> Evaluating your technical setup and
            providing expert advice, troubleshooting, and ongoing maintenance.         </li>
          <li>
            <strong>Cloud Solutions for SMBs:</strong> Helping small to medium businesses migrate to the
            cloud smartly, with scalability and cost in mind.         </li>
        </ul>
      </Card>

      {/* Products Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <Tabs defaultValue="erp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="erp">ERP & Business Central</TabsTrigger>
            <TabsTrigger value="cloud">Cloud & Add-Ins</TabsTrigger>
          </TabsList>

          <TabsContent value="erp" className="mt-4">
            <p className="text-base leading-relaxed mb-4">
              We specialize in **Microsoft Dynamics 365 Business Central**, a powerful ERP solution for
              small and medium businesses.           </p>
            <p className="text-base leading-relaxed">
              This solution helps streamline finance, operations, sales, and more into one unified system.
            </p>
          </TabsContent>

          <TabsContent value="cloud" className="mt-4">
            <ul className="space-y-3 list-disc list-inside text-base">
              <li>
                <strong>Cloud Connect:</strong> Secure, dedicated integration between your infrastructure and cloud.
                         </li>
              <li>
                <strong>Cloud Farm:</strong> Cloud tools tailored for agriculture and aquaculture businesses.             </li>
              <li>
                <strong>Cloud POS:</strong> A cloud‑based point-of-sale system integrated with Business Central.
              </li>
            </ul>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Values / Team Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Our Team & Values</h2>
        <p className="text-base leading-relaxed mb-4">
          Our team is made up of experts in IT, business management, and technology, committed to bringing
          your vision to life with a blend of creativity and technical know-how.
        </p>
        <p className="text-base leading-relaxed">
          We live by our core values: <em>commitment, dedication, innovation,</em> and <em>delivering real results</em>.
        </p>
      </Card>

      {/* Contact / Call to Action */}
      <Card className="p-6 bg-primary text-primary-foreground">
        <h2 className="text-2xl font-semibold mb-2">Ready to Transform?</h2>
        <p className="text-base mb-4">
          Get in touch with us and start your digital transformation journey today.
        </p>
        <a
          href="/contact" 
          className="inline-block px-4 py-2 bg-primary‑foreground text-primary rounded-md hover:bg-primary‑foreground/90"
        >
          Contact Us
        </a>
      </Card>
    </div>
  );
}
