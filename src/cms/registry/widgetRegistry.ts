import React from 'react';

export interface WidgetStyleVariant {
  slug: string;
  label: string;
  description?: string;
  supportedTokens?: string[];
  cssClass?: string;
  overrides?: Record<string, any>;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  category: string;
  preview?: string;
  defaultSize: { w: number; h: number };
  props: Record<string, any>;
  Component: React.FC<any>;
  styleVariants?: WidgetStyleVariant[];
}

// Use Vite's glob import to auto-discover all widget components
const widgetModules = import.meta.glob('/src/widgets/**/index.{jsx,tsx}', { eager: true });

// Build the widget registry by extracting metadata from each component
export const widgetRegistry: WidgetDefinition[] = [];

Object.entries(widgetModules).forEach(([path, module]: [string, any]) => {
  try {
    // Get the default export (the component)
    const Component = module.default;
    
    // Check if the component has metadata attached
    if (Component && Component.meta) {
      const meta = Component.meta;
      
      // Validate required fields
      if (!meta.id || !meta.name || !meta.category) {
        console.warn(`Widget at ${path} is missing required metadata fields (id, name, or category)`);
        return;
      }
      
      // Create the widget definition
      const widgetDef: WidgetDefinition = {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        preview: meta.preview,
        defaultSize: meta.defaultSize || { w: 2, h: 2 },
        props: meta.props || {},
        Component: Component,
        styleVariants: meta.styleVariants || [],
      };
      
      widgetRegistry.push(widgetDef);
    }
  } catch (error) {
    console.error(`Error loading widget from ${path}:`, error);
  }
});

// Helper function to get a widget by ID
export const getWidgetById = (id: string): WidgetDefinition | undefined => {
  return widgetRegistry.find(widget => widget.id === id);
};

// Helper function to get widgets by category
export const getWidgetsByCategory = (category: string): WidgetDefinition[] => {
  return widgetRegistry.filter(widget => widget.category === category);
};

// Helper function to get all available categories
export const getCategories = (): string[] => {
  const categories = new Set(widgetRegistry.map(widget => widget.category));
  return Array.from(categories).sort();
};
