// hooks/useAlert.ts
import { useState, useCallback } from "react"; // Import useCallback
import { 
  showSuccessAlert, 
  showErrorAlert, 
  showWarningAlert, 
  showInfoAlert,
  showConfirmationAlert,
  showAlert as showSweetAlert
} from "@/components/Common/SweetAlert";

interface AlertState {
  show: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
}

/**
 * Legacy state-based alert for inline Alert UI components
 * Use this if you need to display an Alert component in your JSX
 */
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

export function useModalAlert() {
  const showSuccess = (message: string, title: string = "Success") => {
    showSuccessAlert(message, title);
  };

  const showError = (message: string, title: string = "Error") => {
    showErrorAlert(message, title);
  };

  const showWarning = (message: string, title: string = "Warning") => {
    showWarningAlert(message, title);
  };

  const showInfo = (message: string, title: string = "Information") => {
    showInfoAlert(message, title);
  };
  const showGenericAlert = (
    title: string,
    message: string,
    variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default'
  ) => {
    showSweetAlert(title, message, variant);
  };

  /**
   * Show a confirmation dialog
   * Returns a promise that resolves to true if user clicks confirm, false if cancel
   */
  const showConfirm = async (
    title?: string,
    message?: string,
    confirmText?: string,
    cancelText?: string
  ): Promise<boolean> => {
    return showConfirmationAlert({
      title,
      html: message,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      showCancelButton: true,
      customClass: {
        popup: 'sa-confirm-high-z',
      },
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showGenericAlert,
    showConfirm,
  };
}