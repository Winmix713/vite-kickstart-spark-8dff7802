import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick
}) => {
  return <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300" onClick={onClick}>
      <CardContent className="p-4 text-center">
        <div className="text-blue-600 mb-3 flex justify-center">
          {icon}
        </div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>;
};