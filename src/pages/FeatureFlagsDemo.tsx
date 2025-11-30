import React from 'react';
import { usePhaseFlags } from '@/hooks/usePhaseFlags';
const FeatureFlagsDemo: React.FC = () => {
  const {
    isPhase5Enabled,
    isPhase6Enabled,
    isPhase7Enabled,
    isPhase8Enabled,
    isPhase9Enabled
  } = usePhaseFlags();
  return <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Feature Flags Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${isPhase5Enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className="font-semibold mb-2">Phase 5</h3>
          <p className="text-sm text-gray-600 mb-2">Advanced Pattern Detection</p>
          <div className={`text-sm font-medium ${isPhase5Enabled ? 'text-green-600' : 'text-red-600'}`}>
            {isPhase5Enabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isPhase6Enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className="font-semibold mb-2">Phase 6</h3>
          <p className="text-sm text-gray-600 mb-2">Model Evaluation & Feedback Loop</p>
          <div className={`text-sm font-medium ${isPhase6Enabled ? 'text-green-600' : 'text-red-600'}`}>
            {isPhase6Enabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isPhase7Enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className="font-semibold mb-2">Phase 7</h3>
          <p className="text-sm text-gray-600 mb-2">Cross-League Intelligence</p>
          <div className={`text-sm font-medium ${isPhase7Enabled ? 'text-green-600' : 'text-red-600'}`}>
            {isPhase7Enabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isPhase8Enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className="font-semibold mb-2">Phase 8</h3>
          <p className="text-sm text-gray-600 mb-2">Monitoring & Visualization</p>
          <div className={`text-sm font-medium ${isPhase8Enabled ? 'text-green-600' : 'text-red-600'}`}>
            {isPhase8Enabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isPhase9Enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
          <h3 className="font-semibold mb-2">Phase 9</h3>
          <p className="text-sm text-gray-600 mb-2">Collaborative Market Intelligence</p>
          <div className={`text-sm font-medium ${isPhase9Enabled ? 'text-green-600' : 'text-red-600'}`}>
            {isPhase9Enabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-blue-50 border-blue-300">
          <h3 className="font-semibold mb-2">Configuration</h3>
          <p className="text-sm text-gray-600 mb-2">Environment Variables</p>
          <div className="text-xs font-mono space-y-1">
            <div>VITE_FEATURE_PHASE5={isPhase5Enabled}</div>
            <div>VITE_FEATURE_PHASE6={isPhase6Enabled}</div>
            <div>VITE_FEATURE_PHASE7={isPhase7Enabled}</div>
            <div>VITE_FEATURE_PHASE8={isPhase8Enabled}</div>
            <div>VITE_FEATURE_PHASE9={isPhase9Enabled}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">How to Enable Features</h3>
        <p className="text-sm text-gray-600 mb-3">
          Update your .env file and restart the development server:
        </p>
        <div className="text-xs font-mono bg-gray-100 p-3 rounded">
          <div># Example: Enable Phase 9</div>
          <div>VITE_FEATURE_PHASE9="true"</div>
        </div>
      </div>
    </div>;
};
export default FeatureFlagsDemo;