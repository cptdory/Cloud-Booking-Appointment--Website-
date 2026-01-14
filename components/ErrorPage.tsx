"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, LucideIcon, Home, Mail, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ErrorPageProps {
  title: string;
  description: string;
  message?: string;
  icon?: LucideIcon;
  showGoBack?: boolean;
  showContactAdmin?: boolean;
  contactAdminEmail?: string;
  additionalActions?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  }[];
}

export function ErrorPage({
  title,
  description,
  message,
  icon: Icon = AlertCircle,
  showGoBack = true,
  showContactAdmin = true,
  contactAdminEmail = "admin@example.com",
  additionalActions = [],
}: ErrorPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-red-200 dark:border-red-900">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
              <Icon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {description}
            </p>
            {message && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {message}
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>What to do:</strong> Please contact the system administrator to resolve this issue.
            </p>
          </div>

          <div className="flex gap-3">
            {showGoBack && (
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            {showContactAdmin && (
              <Button
                onClick={() => (window.location.href = `mailto:${contactAdminEmail}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Admin
              </Button>
            )}
            {additionalActions.map((action, idx) => (
              <Button
                key={idx}
                onClick={action.onClick}
                variant={action.variant || "default"}
                className="flex-1"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
