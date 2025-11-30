// hooks/useAlert.ts
import { useState } from "react";

interface AlertState {
  show: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    title: "",
    description: "",
    variant: "default",
  });

  const showAlert = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default"
  ) => {
    setAlert({
      show: true,
      title,
      description,
      variant,
    });

    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 6000);
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, show: false }));
  };

  return { alert, showAlert, hideAlert };
}