import React from "react";
import { widgetRegistry, getCategories } from "@cms/registry/widgetRegistry";
import WidgetRenderer from "@cms/runtime/WidgetRenderer";

const WidgetRegistryDemo = () => {
  const categories = getCategories();

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}
        >
          Widget Registry Demo
        </h1>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "24px" }}>
          Testing the CMS Phase 1 - Widget Registry & Renderer
        </p>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Registry Stats
          </h2>
          <div style={{ display: "flex", gap: "24px" }}>
            <div>
              <strong>Total Widgets:</strong> {widgetRegistry.length}
            </div>
            <div>
              <strong>Categories:</strong> {categories.join(", ")}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
            }}
          >
            Registered Widgets
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {widgetRegistry.map((widget) => (
              <li
                key={widget.id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{widget.name}</strong>
                    <span
                      style={{
                        marginLeft: "12px",
                        color: "#666",
                        fontSize: "14px",
                      }}
                    >
                      ({widget.id})
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {widget.category}
                    </span>
                  </div>
                </div>
                <div
                  style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}
                >
                  Default size: {widget.defaultSize.w}x{widget.defaultSize.h}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
        >
          Widget Renderer Demo
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              TeamStats Widget
            </h3>
            <WidgetRenderer
              type="team_stats"
              props={{ teamId: "real-madrid", season: "2024" }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              LeagueTable Widget
            </h3>
            <WidgetRenderer
              type="league_table"
              props={{ league: "La Liga", season: "2023-24" }}
            />
          </div>

          <div>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Unknown Widget (Error Test)
            </h3>
            <WidgetRenderer type="non_existent_widget" props={{}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetRegistryDemo;
