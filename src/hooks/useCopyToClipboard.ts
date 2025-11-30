import { useState, useCallback } from 'react';
import { toast } from 'sonner';
export interface CopyState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  lastCopied: string | null;
}
export interface CopyOptions {
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Utility function to copy text to clipboard with fallback
 * Can be used outside React components
 */
export async function copyToClipboard(text: string, options: CopyOptions = {}): Promise<boolean> {
  const {
    onSuccess,
    onError,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy to clipboard'
  } = options;
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!successful) {
        throw new Error('Copy command failed');
      }
    }
    onSuccess?.(text);
    if (successMessage) {
      toast.success(successMessage);
    }
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
    if (errorMessage) {
      toast.error(errorMessage);
    }
    return false;
  }
}

/**
 * React hook for clipboard operations with state management
 */
export function useCopyToClipboard(defaultOptions?: CopyOptions) {
  const [state, setState] = useState<CopyState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    lastCopied: null
  });
  const copy = useCallback(async (text: string, options?: CopyOptions): Promise<boolean> => {
    const mergedOptions = {
      ...defaultOptions,
      ...options
    };
    setState(prev => ({
      ...prev,
      isLoading: true,
      isSuccess: false,
      error: null
    }));
    try {
      const success = await copyToClipboard(text, mergedOptions);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: success,
        error: success ? null : 'Copy operation failed',
        lastCopied: success ? text : null
      }));
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: false,
        error: err.message,
        lastCopied: null
      }));
      return false;
    }
  }, [defaultOptions]);
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      lastCopied: null
    });
  }, []);
  return {
    ...state,
    copy,
    reset
  };
}