import { useMutation, useQuery } from '@tanstack/react-query';
import type { AIChatRequest, AIChatResponse, ChatMessage } from '../types/ai-chat';
import { supabase } from '../integrations/supabase/client';
export function useAIChat() {
  const chatMutation = useMutation({
    mutationFn: async (request: AIChatRequest) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-chat', {
        body: request
      });
      if (error) {
        throw new Error(error.message);
      }
      return data as AIChatResponse;
    }
  });
  return {
    sendMessage: chatMutation.mutateAsync,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
    data: chatMutation.data,
    reset: chatMutation.reset
  };
}
export function useChatHistory() {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return [];
      const {
        data,
        error
      } = await supabase.from('ai_chat_history').select('*').eq('user_id', user.data.user.id).order('created_at', {
        ascending: false
      }).limit(50);
      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}