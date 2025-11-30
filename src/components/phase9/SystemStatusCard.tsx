import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
interface SystemStatusCardProps {
  title: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'error';
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}
export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  title,
  icon,
  status,
  description,
  color
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      orange: 'border-orange-200 bg-orange-50',
      purple: 'border-purple-200 bg-purple-50'
    };
    return colors[color] || colors.blue;
  };
  return <Card className={getColorClasses(color)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
            {icon}
          </div>
          {getStatusIcon(status)}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <div className={`text-sm font-medium ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </div>
      </CardContent>
    </Card>;
};