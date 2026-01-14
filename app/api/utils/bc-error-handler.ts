/**
 * BC Error Handler Utility
 * Standardizes error responses from Business Central API
 */

interface BCError {
  code?: string;
  message: string;
}

interface ErrorResponse {
  error: BCError;
}

/**
 * Parse BC error from response text
 * Handles various BC error formats and returns standardized error object
 */
export function parseBCError(text: string): BCError {
  try {
    const data = JSON.parse(text);
    
    // Handle nested error object { error: { code, message } }
    if (data.error) {
      return {
        code: data.error.code || "BC_Error",
        message: data.error.message || "An error occurred",
      };
    }
    
    // Handle direct error message
    if (data.message) {
      return {
        code: data.code || "BC_Error",
        message: data.message,
      };
    }
    
    // Handle other formats
    return {
      code: "BC_Error",
      message: JSON.stringify(data),
    };
  } catch (e) {
    // If not JSON, return text as message
    return {
      code: "BC_Error",
      message: text || "Unknown error occurred",
    };
  }
}

/**
 * Create standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage: string = "An error occurred"
): { error: BCError } {
  if (error instanceof Error) {
    // Try to parse as BC error
    if (error.message.startsWith("{")) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.code && parsed.message) {
          return { error: parsed as BCError };
        }
      } catch (e) {
        // Not JSON, fall through to default
      }
    }
    
    return {
      error: {
        code: "Error",
        message: error.message || fallbackMessage,
      },
    };
  }

  return {
    error: {
      code: "Unknown_Error",
      message: fallbackMessage,
    },
  };
}

/**
 * Throw BC error as structured JSON string for consistent handling
 */
export function throwBCError(message: string, code: string = "BC_Error"): never {
  throw new Error(JSON.stringify({ code, message }));
}
