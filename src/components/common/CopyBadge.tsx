import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCopyToClipboard, type CopyOptions } from '@/hooks/useCopyToClipboard';
export interface CopyBadgeProps {
  text: string;
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
  'aria-label'?: string;
}

/**
 * A badge component that copies text to clipboard when clicked
 * Useful for inline copy actions like IDs, codes, or short text snippets
 */
export const CopyBadge: React.FC<CopyBadgeProps> = ({
  text,
  children,
  variant = 'secondary',
  className,
  disabled,
  showIcon = false,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  'aria-label': ariaLabel = `Copy: ${text}`,
  ...props
}) => {
  const {
    copy,
    isLoading,
    isSuccess
  } = useCopyToClipboard({
    successMessage: successMessage || 'Copied to clipboard',
    errorMessage: errorMessage || 'Failed to copy to clipboard',
    onSuccess,
    onError
  });
  const handleClick = async () => {
    await copy(text);
  };
  return <Badge variant={variant} className={cn('cursor-pointer select-none transition-all duration-200 hover:bg-opacity-80', 'inline-flex items-center gap-1', isSuccess && 'bg-green-100 text-green-800 border-green-200', isLoading && 'opacity-50 cursor-not-allowed', disabled && 'opacity-50 cursor-not-allowed', className)} onClick={disabled || isLoading ? undefined : handleClick} aria-label={ariaLabel} {...props}>
      {showIcon && <span className="inline-flex items-center">
          {isSuccess ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
        </span>}
      <span className={cn(isSuccess && 'text-green-700')}>
        {children}
      </span>
    </Badge>;
};
export default CopyBadge;