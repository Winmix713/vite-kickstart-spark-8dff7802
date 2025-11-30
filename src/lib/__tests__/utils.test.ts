import { describe, it, expect } from 'vitest';
import { cn } from '../utils';
describe('cn utility', () => {
  it('should merge single class name', () => {
    expect(cn('btn')).toBe('btn');
  });
  it('should merge multiple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });
  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
  });
  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
  it('should handle object syntax', () => {
    expect(cn({
      btn: true,
      active: true,
      disabled: false
    })).toBe('btn active');
  });
  it('should handle arrays', () => {
    expect(cn(['btn', 'primary'])).toBe('btn primary');
  });
  it('should handle complex combinations', () => {
    const isClickable = true;
    const result = cn('btn', {
      active: true,
      disabled: false
    }, ['primary', 'large'], isClickable && 'clickable');
    expect(result).toBe('btn active primary large clickable');
  });
  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined, null, '')).toBe('');
  });
  it('should deduplicate Tailwind utility classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
  it('should maintain non-conflicting classes', () => {
    expect(cn('text-lg', 'bg-blue-500', 'p-4')).toBe('text-lg bg-blue-500 p-4');
  });
  it('should handle responsive classes', () => {
    expect(cn('text-sm', 'md:text-lg', 'lg:text-xl')).toBe('text-sm md:text-lg lg:text-xl');
  });
  it('should handle hover and state variants', () => {
    expect(cn('bg-blue-500', 'hover:bg-blue-600', 'active:bg-blue-700')).toBe('bg-blue-500 hover:bg-blue-600 active:bg-blue-700');
  });
});