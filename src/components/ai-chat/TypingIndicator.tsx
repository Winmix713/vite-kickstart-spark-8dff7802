import React from 'react';
interface TypingIndicatorProps {
  theme?: 'light' | 'dark';
}
const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  theme = 'light'
}) => {
  return <div className="flex justify-start">
      <div className={`px-4 py-3 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-slate-800 rounded-bl-none border border-slate-700' : 'bg-slate-200 rounded-bl-none border border-slate-300'}`}>
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{
          animationDelay: '0ms'
        }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{
          animationDelay: '150ms'
        }} />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{
          animationDelay: '300ms'
        }} />
        </div>
      </div>
    </div>;
};
export default TypingIndicator;