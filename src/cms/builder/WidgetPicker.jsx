import React, { useState, useMemo } from 'react';
import { widgetRegistry, getCategories } from '../index';
import './builder.css';

const WidgetChip = ({ widget, onDragStart, onClick }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          type: widget.id,
          defaultProps: widget.meta?.defaultProps || {}
        }));
        onDragStart?.(widget);
      }}
      onClick={() => onClick?.(widget)}
      className="widget-chip p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
    >
      {widget.meta?.icon && <span className="mr-2">{widget.meta.icon}</span>}
      <span className="font-medium text-sm">{widget.meta?.name || widget.id}</span>
      <p className="text-xs text-gray-500 mt-1">{widget.meta?.description}</p>
    </div>
  );
};

export const WidgetPicker = ({ onWidgetSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const categories = getCategories();
  
  const widgetsByCategory = useMemo(() => {
    const groups = {};
    categories.forEach(category => {
      const widgets = getWidgetsByCategory(category);
      if (widgets.length > 0) {
        groups[category] = widgets;
      }
    });
    return groups;
  }, [categories]);

  const filteredWidgetsByCategory = useMemo(() => {
    if (!searchTerm) return widgetsByCategory;
    
    const filtered = {};
    Object.entries(widgetsByCategory).forEach(([category, widgets]) => {
      const filteredWidgets = widgets.filter(widget => 
        widget.meta?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.meta?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredWidgets.length > 0) {
        filtered[category] = filteredWidgets;
      }
    });
    return filtered;
  }, [widgetsByCategory, searchTerm]);

  const handleWidgetSelect = (widget) => {
    onWidgetSelect?.(widget);
  };

  const handleDragStart = (widget) => {
    // Drag start handler
  };

  return (
    <div className="widget-picker h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search widgets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(filteredWidgetsByCategory).map(([category, widgets]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {widgets.map(widget => (
                <WidgetChip
                  key={widget.id}
                  widget={widget}
                  onDragStart={handleDragStart}
                  onClick={handleWidgetSelect}
                />
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(filteredWidgetsByCategory).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No widgets found
          </div>
        )}
      </div>
    </div>
  );
};