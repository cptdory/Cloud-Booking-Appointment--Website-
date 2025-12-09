// hooks/useAlert.ts
import { useState, useCallback } from "react"; // Import useCallback

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

  const showAlert = useCallback(
    (
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
    },
    []
  ); // Empty dependency array as setAlert is stable

  const hideAlert = useCallback(() => { // Also wrap hideAlert for consistency
    setAlert((prev) => ({ ...prev, show: false }));
  }, []); // Empty dependency array as setAlert is stable

  return { alert, showAlert, hideAlert };
}