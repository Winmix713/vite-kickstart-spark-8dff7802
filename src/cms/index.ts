export { 
  widgetRegistry, 
  getWidgetById, 
  getWidgetsByCategory, 
  getCategories 
} from './registry/widgetRegistry';

export type { WidgetDefinition } from './registry/widgetRegistry';

export { WidgetRenderer } from './runtime/WidgetRenderer';
export { default as WidgetRendererDefault } from './runtime/WidgetRenderer';
