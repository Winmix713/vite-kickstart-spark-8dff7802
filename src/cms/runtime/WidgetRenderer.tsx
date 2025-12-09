import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getWidgetById } from "../registry/widgetRegistry";

interface WidgetRendererProps {
  type: string;
  props?: Record<string, any>;
  variant?: string;
  instanceId?: string;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div
      role="alert"
      style={{
        padding: "20px",
        backgroundColor: "#fee",
        border: "1px solid #fcc",
        borderRadius: "8px",
        color: "#c33",
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}
      >
        Widget Error
      </h3>
      <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: "8px 16px",
          backgroundColor: "#c33",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Retry
      </button>
    </div>
  );
};

const LoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        color: "#666",
      }}
    >
      Loading widget...
    </div>
  );
};

const UnknownWidgetFallback: React.FC<{ type: string }> = ({ type }) => {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ffc",
        border: "1px solid #cc9",
        borderRadius: "8px",
        color: "#663",
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}
      >
        Unknown Widget
      </h3>
      <p style={{ margin: 0, fontSize: "14px" }}>
        Widget type "{type}" not found in registry.
      </p>
    </div>
  );
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  type,
  props = {},
  variant = "default",
  instanceId,
}) => {
  const widgetDef = getWidgetById(type);

  if (!widgetDef) {
    return <UnknownWidgetFallback type={type} />;
  }

  const { Component, styleVariants = [] } = widgetDef;

  // Get the variant configuration
  const variantConfig = styleVariants.find((v) => v.slug === variant);

  // Build class names for the widget
  let className = "cms-widget-" + variant;
  if (variantConfig?.cssClass) {
    className += " " + variantConfig.cssClass;
  }

  // Merge variant props if they exist
  const mergedProps = {
    ...props,
    "data-cms-variant": variant,
    "data-cms-instance-id": instanceId,
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Optional: Add any cleanup or reset logic here
        console.log("Resetting widget error boundary");
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <div className={className}>
          <Component {...mergedProps} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default WidgetRenderer;
