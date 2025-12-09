import Swal from 'sweetalert2';

interface SweetAlertOptions {
  title?: string;
  html?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  customClass?: {
    popup?: string;
    title?: string;
    htmlContainer?: string;
    confirmButton?: string;
    cancelButton?: string;
    actions?: string;
    icon?: string;
  };
}

// Initialize toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showSuccessAlert = (message: string, title: string = 'Success') => {
  Swal.fire({
    title,
    html: message,
    icon: 'success',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'sa-success',
    },
  });
};

export const showErrorAlert = (message: string, title: string = 'Error') => {
  Swal.fire({
    title,
    html: message,
    icon: 'error',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'sa-error',
    },
  });
};

export const showWarningAlert = (message: string, title: string = 'Warning') => {
  Swal.fire({
    title,
    html: message,
    icon: 'warning',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'sa-warning',
    },
  });
};

export const showInfoAlert = (message: string, title: string = 'Information') => {
  Swal.fire({
    title,
    html: message,
    icon: 'info',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'sa-info',
    },
  });
};

// Toast functions
export const showSuccessToast = (message: string) => {
  Toast.fire({
    icon: 'success',
    title: message,
  });
};

export const showErrorToast = (message: string) => {
  Toast.fire({
    icon: 'error',
    title: message,
  });
};

export const showWarningToast = (message: string) => {
  Toast.fire({
    icon: 'warning',
    title: message,
  });
};

export const showInfoToast = (message: string) => {
  Toast.fire({
    icon: 'info',
    title: message,
  });
};

// General alert function that takes variant
export const showAlert = (title: string, message: string, variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default') => {
  const iconMap = {
    default: 'info' as const,
    destructive: 'error' as const,
    success: 'success' as const,
    warning: 'warning' as const,
    info: 'info' as const,
  };

  Swal.fire({
    title,
    html: message,
    icon: iconMap[variant],
    confirmButtonText: 'OK',
    customClass: {
      popup: `sa-${variant}`,
    },
  });
};

export const showConfirmationAlert = async (options: SweetAlertOptions) => {
  const result = await Swal.fire({
    title: options.title || 'Are you sure?',
    html: options.html,
    icon: options.icon || 'warning',
    showCancelButton: options.showCancelButton !== undefined ? options.showCancelButton : true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    cancelButtonText: options.cancelButtonText || 'No',
    customClass: options.customClass || {
      popup: 'sa-confirm',
    },
  });
  return result.isConfirmed;
};

// Response toast that automatically detects type based on message content
export const showResponseToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
  let toastType = type;
  
  // Auto-detect type if not provided
  if (!toastType) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('success') || lowerMessage.includes('successful') || lowerMessage.includes('created') || lowerMessage.includes('updated') || lowerMessage.includes('deleted')) {
      toastType = 'success';
    } else if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('invalid') || lowerMessage.includes('incorrect')) {
      toastType = 'error';
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
      toastType = 'warning';
    } else {
      toastType = 'info';
    }
  }
  
  Toast.fire({
    icon: toastType,
    title: message,
  });
};
