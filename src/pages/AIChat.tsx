import React, { useState } from 'react';
import { AIChatInterface } from '@/components/ai-chat';
import type { TeamPair } from '@/types/ai-chat';
const AIChat: React.FC = () => {
  const [selectedTeams, setSelectedTeams] = useState<TeamPair | null>(null);
  const handlePredictionRequest = (teams: TeamPair) => {
    setSelectedTeams(teams);
  };
  return <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Interface - Full Width */}
      <div className="flex-1 overflow-hidden">
        <AIChatInterface onPredictionRequest={handlePredictionRequest} theme="light" />
      </div>

      {/* Selected Teams Info */}
      {selectedTeams && <div className="p-4 border-t border-slate-200 bg-white">
          <p className="text-sm text-slate-600">
            Kiválasztott mérkőzés: <span className="font-semibold">{selectedTeams.home} vs {selectedTeams.away}</span>
          </p>
        </div>}
    </div>;
};
export default AIChat;