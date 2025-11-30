import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ChatMessage, AIChatResponse } from '../../types/ai-chat';
import { supabase } from '../../integrations/supabase/client';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';
import { AlertCircle } from 'lucide-react';
interface AIChatInterfaceProps {
  onPredictionRequest?: (teams: {
    home: string;
    away: string;
  }) => void;
  theme?: 'light' | 'dark';
}
export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  onPredictionRequest,
  theme = 'light'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '0',
      role: 'assistant',
      content: 'Sziasztok! 👋 Én vagyok a WinMix AI asszisztens. Kérdezzetek meg bármit két csapatról, és megadok egy részletes elemzést, predikciót és fogadási javaslatot!',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-chat', {
        body: {
          message,
          conversationHistory: messages,
          context: {
            userId: (await supabase.auth.getUser()).data?.user?.id
          }
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      return data as AIChatResponse;
    },
    onSuccess: response => {
      if (response.success && response.message) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            teams: response.analysis?.teams,
            league: response.analysis?.league,
            patterns: response.analysis?.patterns,
            prediction: response.analysis?.prediction
          }
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Trigger prediction callback if teams are identified
        if (response.analysis?.teams && onPredictionRequest) {
          onPredictionRequest(response.analysis.teams);
        }
      }
      setIsLoading(false);
    },
    onError: error => {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sajnálom, hiba történt: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  });
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    await sendMessageMutation.mutateAsync(inputValue);
  };
  const handleQuickAction = (query: string) => {
    setInputValue(query);
  };
  return <div className={`flex flex-col h-full bg-${theme === 'dark' ? 'slate-900' : 'white'} rounded-lg shadow-lg`}>
      {/* Header */}
      <div className={`p-4 border-b border-${theme === 'dark' ? 'slate-700' : 'slate-200'}`}>
        <h2 className={`text-lg font-semibold text-${theme === 'dark' ? 'white' : 'slate-900'}`}>
          WinMix AI Elemző
        </h2>
        <p className={`text-sm text-${theme === 'dark' ? 'slate-400' : 'slate-600'}`}>
          Kérdezzetek meg bármiről a csapatokról és a mérkőzésekről
        </p>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-${theme === 'dark' ? 'slate-950' : 'slate-50'}`}>
        {messages.map(message => <MessageBubble key={message.id} message={message} theme={theme} />)}

        {isLoading && <TypingIndicator theme={theme} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (only show if no recent messages) */}
      {messages.length === 1 && <QuickActions onSelect={handleQuickAction} theme={theme} />}

      {/* Error state */}
      {sendMessageMutation.isError && <div className={`p-3 mx-4 rounded-lg bg-red-50 border border-red-200 flex gap-2`}>
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">
            Hiba a lekérdezés feldolgozása közben. Kérjük, próbálja újra.
          </p>
        </div>}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className={`p-4 border-t border-${theme === 'dark' ? 'slate-700' : 'slate-200'}`}>
        <div className="flex gap-2">
          <input ref={inputRef} type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="pl. Real Madrid vs Barcelona..." disabled={isLoading} className={`flex-1 px-4 py-2 rounded-lg border border-${theme === 'dark' ? 'slate-600' : 'slate-300'} bg-${theme === 'dark' ? 'slate-800' : 'white'} text-${theme === 'dark' ? 'white' : 'slate-900'} placeholder-${theme === 'dark' ? 'slate-400' : 'slate-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
          <button type="submit" disabled={isLoading || !inputValue.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? '...' : 'Küldés'}
          </button>
        </div>
      </form>
    </div>;
};
export default AIChatInterface;