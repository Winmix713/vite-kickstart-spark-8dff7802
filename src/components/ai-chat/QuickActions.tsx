import React from 'react';
import { MessageSquare, TrendingUp, Zap, Target } from 'lucide-react';
interface QuickActionsProps {
  onSelect: (query: string) => void;
  theme?: 'light' | 'dark';
}
const QuickActions: React.FC<QuickActionsProps> = ({
  onSelect,
  theme = 'light'
}) => {
  const actions = [{
    icon: MessageSquare,
    label: 'Hazai vs Vendég',
    query: 'Elemezz egy hazai és egy vendég csapatot'
  }, {
    icon: TrendingUp,
    label: 'Forma Elemzés',
    query: 'Milyen az utolsó 5 meccs alapján a csapatok formája?'
  }, {
    icon: Target,
    label: 'H2H Profil',
    query: 'Mi a korábbi egymás elleni mérkőzések eredménye?'
  }, {
    icon: Zap,
    label: 'Haladó Elemzés',
    query: 'Végezz részletes statisztikai elemzést'
  }];
  return <div className={`px-4 py-3 border-t border-${theme === 'dark' ? 'slate-700' : 'slate-200'}`}>
      <p className={`text-xs font-semibold mb-2 text-${theme === 'dark' ? 'slate-400' : 'slate-600'} uppercase`}>
        Gyors műveletek
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
        const Icon = action.icon;
        return <button key={index} onClick={() => onSelect(action.query)} className={`p-2 rounded-lg text-left text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'} flex items-center gap-2`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>;
      })}
      </div>
    </div>;
};
export default QuickActions;