import React from 'react';
interface HealthMetricProps {
  title: string;
  value: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
}
export const HealthMetric: React.FC<HealthMetricProps> = ({
  title,
  value,
  status,
  description
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  return <div className="text-center">
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      <div className={`text-3xl font-bold mb-2 ${getStatusColor(status)}`}>
        {value}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>;
};