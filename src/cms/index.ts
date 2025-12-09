export {
  widgetRegistry,
  getWidgetById,
  getWidgetsByCategory,
  getCategories,
} from "./registry/widgetRegistry";

export type {
  WidgetDefinition,
  WidgetStyleVariant,
} from "./registry/widgetRegistry";

export { WidgetRenderer } from "./runtime/WidgetRenderer";
export { default as WidgetRendererDefault } from "./runtime/WidgetRenderer";

// Theme exports
export {
  CmsThemeProvider,
  useCmsTheme,
  useCmsThemeSafe,
} from "./theme/ThemeProvider";

export {
  colorPalette,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
  themeVariants,
  widgetStyleVariants,
  buildCssVariables,
  getThemeVariant,
  getThemeVariantNames,
  getWidgetStyleVariant,
  getWidgetStyleVariantSlugs,
} from "./theme/tokens";

export { default as PropsEditor } from "./runtime/PropsEditor";
