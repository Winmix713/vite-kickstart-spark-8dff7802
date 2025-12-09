import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { updateInstanceProps } from '../../features/pageBuilder/pageBuilderSlice';

export const PropsEditor = () => {
  const dispatch = useDispatch();
  const { selectedInstanceId, instancesById } = useSelector(state => state.pageBuilder);
  const [activeTab, setActiveTab] = useState('props');
  
  const selectedInstance = selectedInstanceId ? instancesById[selectedInstanceId] : null;
  
  const formMethods = useForm({
    defaultValues: selectedInstance?.props || {}
  });

  const { handleSubmit, register, watch, reset } = formMethods;

  useEffect(() => {
    if (selectedInstance) {
      reset(selectedInstance.props);
    }
  }, [selectedInstance, reset]);

  const onSubmit = (data) => {
    if (selectedInstanceId) {
      dispatch(updateInstanceProps({ instanceId: selectedInstanceId, props: data }));
    }
  };

  const renderPropField = (key, config, value, parentPath = '') => {
    const fieldPath = parentPath ? `${parentPath}.${key}` : key;
    const fullWidth = config.type === 'textarea' || config.type === 'json';

    const renderInput = () => {
      switch (config.type) {
        case 'string':
        case 'text':
          return (
            <input
              type="text"
              {...register(fieldPath)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={config.placeholder || ''}
            />
          );
        
        case 'number':
          return (
            <input
              type="number"
              {...register(fieldPath)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={config.placeholder || ''}
              step={config.step || 'any'}
              min={config.min}
              max={config.max}
            />
          );
        
        case 'boolean':
          return (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register(fieldPath)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{config.label || key}</span>
            </label>
          );
        
        case 'select':
          return (
            <select
              {...register(fieldPath)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {config.options?.map(option => (
                <option key={option.value || option} value={option.value || option}>
                  {option.label || option}
                </option>
              ))}
            </select>
          );
        
        case 'color':
          return (
            <div className="flex items-center space-x-2">
              <input
                type="color"
                {...register(fieldPath)}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                {...register(fieldPath)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          );
        
        case 'textarea':
          return (
            <textarea
              {...register(fieldPath)}
              rows={config.rows || 3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={config.placeholder || ''}
            />
          );
        
        case 'object':
          if (config.properties) {
            return (
              <div className="ml-4 space-y-3">
                {Object.entries(config.properties).map(([propKey, propConfig]) =>
                  renderPropField(propKey, propConfig, value?.[propKey], fieldPath)
                )}
              </div>
            );
          }
          return null;
        
        default:
          return (
            <input
              type="text"
              {...register(fieldPath)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={config.placeholder || ''}
            />
          );
      }
    };

    return (
      <div
        key={fieldPath}
        className={`mb-4 ${fullWidth ? 'col-span-2' : ''}`}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {config.label || key}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {config.description && (
          <p className="mt-1 text-xs text-gray-500">{config.description}</p>
        )}
      </div>
    );
  };

  if (!selectedInstance) {
    return (
      <div className="props-editor h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
          <p className="text-sm text-gray-500">Select a widget to edit its properties</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Select a widget to configure</p>
          </div>
        </div>
      </div>
    );
  }

  // Get widget schema from registry if available
  const widgetSchema = selectedInstance.type?.startsWith('custom/') 
    ? { type: 'object', properties: {} }
    : { type: 'object', properties: {} };

  return (
    <div className="props-editor h-full flex flex-col">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('props')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'props'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'advanced'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4">
        {activeTab === 'props' ? (
          <div className="space-y-4">
            {widgetSchema.properties && Object.keys(widgetSchema.properties).length > 0 ? (
              Object.entries(widgetSchema.properties).map(([key, config]) =>
                renderPropField(key, config, selectedInstance.props[key])
              )
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Widget:</strong> {selectedInstance.type}
                  </p>
                </div>
                <div className="space-y-3">
                  {Object.entries(selectedInstance.props).map(([key, value]) => (
                    <div key={key} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={JSON.stringify(value)}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                Advanced configuration options will appear here
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instance ID
                </label>
                <input
                  type="text"
                  value={selectedInstanceId}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </form>
    </div>
  );
};
