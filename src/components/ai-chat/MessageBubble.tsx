import React from 'react';
import type { ChatMessage } from '../../types/ai-chat';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
interface MessageBubbleProps {
  message: ChatMessage;
  theme?: 'light' | 'dark';
}
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  theme = 'light'
}) => {
  const isUser = message.role === 'user';
  const contentRenderer = () => {
    // Basic markdown-like rendering for the content
    const lines = message.content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('##')) {
        return <h3 key={i} className="font-bold text-lg mt-2">{line.replace(/^#+\s/, '')}</h3>;
      }
      if (line.startsWith('-') || line.startsWith('•')) {
        return <li key={i} className="ml-4">{line.replace(/^[-•]\s/, '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-sm">{line}</p>;
    });
  };
  return <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md px-4 py-3 rounded-lg shadow-sm ${isUser ? 'bg-blue-600 text-white rounded-br-none' : theme === 'dark' ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700' : 'bg-slate-200 text-slate-900 rounded-bl-none border border-slate-300'}`}>
        <div className="text-sm leading-relaxed">
          {contentRenderer()}
        </div>

        {/* Metadata indicators */}
        {!isUser && message.metadata && <div className="mt-2 pt-2 border-t border-opacity-30 border-current space-y-1">
            {message.metadata.teams && <div className="flex items-center gap-1 text-xs opacity-75">
                <span>🏟️</span>
                <span>{message.metadata.teams.home} vs {message.metadata.teams.away}</span>
              </div>}
            {message.metadata.prediction && <div className="flex items-center gap-1 text-xs opacity-75">
                <TrendingUp className="w-3 h-3" />
                <span>Konfidencia: {Math.round(message.metadata.prediction.confidence * 100)}%</span>
              </div>}
            {message.metadata.patterns && message.metadata.patterns.length > 0 && <div className="flex items-center gap-1 text-xs opacity-75">
                <CheckCircle2 className="w-3 h-3" />
                <span>{message.metadata.patterns.length} minta észlelve</span>
              </div>}
          </div>}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${isUser ? 'opacity-70' : 'opacity-50'}`}>
          {message.timestamp.toLocaleTimeString('hu-HU', {
          hour: '2-digit',
          minute: '2-digit'
        })}
        </div>
      </div>
    </div>;
};
export default MessageBubble;