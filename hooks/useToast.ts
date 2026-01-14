import { showResponseToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "@/components/Common/SweetAlert";

/**
 * Hook for showing toast notifications in components
 * Automatically extracts error messages from API responses
 */
export function useToast() {
  const showError = (error: unknown, fallback: string = "An error occurred") => {
    let message = fallback;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object") {
      const errorObj = error as Record<string, any>;
      
      // Handle BC error format: { error: { message, code } }
      if (errorObj.error?.message) {
        message = errorObj.error.message;
      }
      // Handle error message format: { message }
      else if (errorObj.message) {
        message = errorObj.message;
      }
      // Handle error string format: { error: "string" }
      else if (typeof errorObj.error === "string") {
        message = errorObj.error;
      }
    }
    
    showErrorToast(message);
  };

  const showSuccess = (message: string = "Operation successful") => {
    showSuccessToast(message);
  };

  const showWarning = (message: string) => {
    showWarningToast(message);
  };

  const showInfo = (message: string) => {
    showInfoToast(message);
  };

  /**
   * Handle API response and show appropriate toast
   */
  const handleResponse = async (
    response: Response,
    successMessage?: string,
    errorFallback?: string
  ) => {
    if (!response.ok) {
      const data = await response.json();
      showError(data, errorFallback || "Operation failed");
      return null;
    }

    const data = await response.json();
    if (successMessage) {
      showSuccess(successMessage);
    }
    return data;
  };

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    handleResponse,
  };
}
