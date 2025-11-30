import React from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCopyToClipboard, type CopyOptions } from '@/hooks/useCopyToClipboard';
export interface CopyButtonProps {
  text: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
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
 * A button component that copies text to clipboard with visual feedback
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  children,
  variant = 'ghost',
  size = 'sm',
  className,
  disabled,
  showIcon = true,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  'aria-label': ariaLabel = 'Copy to clipboard',
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
  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    return <Copy className="h-4 w-4" />;
  };
  return <Button variant={variant} size={size} className={cn('gap-2 transition-all duration-200', isSuccess && 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100', className)} disabled={disabled || isLoading} onClick={handleClick} aria-label={ariaLabel} {...props}>
      {showIcon && getIcon()}
      {children && <span className={cn(isSuccess && 'text-green-700')}>
          {isSuccess ? 'Copied!' : children}
        </span>}
    </Button>;
};
export default CopyButton;