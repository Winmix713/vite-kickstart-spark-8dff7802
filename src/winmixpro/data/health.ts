export type HealthLevel = "ok" | "warning" | "critical";
export interface WinmixHealthMetricCell {
  label: string;
  value: string;
  level: HealthLevel;
}
export interface WinmixHealthRow {
  service: string;
  metrics: Record<string, WinmixHealthMetricCell>;
}
export interface WinmixHealthAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  timestamp: string;
}
export const winmixHealthMetricKeys = [{
  key: "latency",
  label: "Válaszidő"
}, {
  key: "errors",
  label: "Hibaarány"
}, {
  key: "cpu",
  label: "CPU"
}, {
  key: "freshness",
  label: "Frissesség"
}];
export const winmixHealthMatrix: WinmixHealthRow[] = [{
  service: "Adat betöltés",
  metrics: {
    latency: {
      label: "210 ms",
      value: "210 ms",
      level: "ok"
    },
    errors: {
      label: "0.8%",
      value: "0.8%",
      level: "warning"
    },
    cpu: {
      label: "62%",
      value: "62%",
      level: "ok"
    },
    freshness: {
      label: "19 perc",
      value: "19 perc",
      level: "critical"
    }
  }
}, {
  service: "Model szolgáltatás",
  metrics: {
    latency: {
      label: "148 ms",
      value: "148 ms",
      level: "ok"
    },
    errors: {
      label: "0.3%",
      value: "0.3%",
      level: "ok"
    },
    cpu: {
      label: "71%",
      value: "71%",
      level: "warning"
    },
    freshness: {
      label: "11 perc",
      value: "11 perc",
      level: "ok"
    }
  }
}, {
  service: "Phase 9 blending",
  metrics: {
    latency: {
      label: "182 ms",
      value: "182 ms",
      level: "ok"
    },
    errors: {
      label: "1.3%",
      value: "1.3%",
      level: "warning"
    },
    cpu: {
      label: "83%",
      value: "83%",
      level: "warning"
    },
    freshness: {
      label: "6 perc",
      value: "6 perc",
      level: "ok"
    }
  }
}, {
  service: "Vizualizáció",
  metrics: {
    latency: {
      label: "302 ms",
      value: "302 ms",
      level: "warning"
    },
    errors: {
      label: "0.2%",
      value: "0.2%",
      level: "ok"
    },
    cpu: {
      label: "51%",
      value: "51%",
      level: "ok"
    },
    freshness: {
      label: "15 perc",
      value: "15 perc",
      level: "warning"
    }
  }
}];
export const winmixHealthAlerts: WinmixHealthAlert[] = [{
  id: "alert-1",
  severity: "warning",
  title: "Piaci API limit elérése",
  description: "BetRadar 429-es választ adott, 3 perc múlva újrapróbáljuk.",
  timestamp: "08:32"
}, {
  id: "alert-2",
  severity: "info",
  title: "Frissesség küszöb közelében",
  description: "Premier League feed 19 perce frissült, backup útvonal kész.",
  timestamp: "08:40"
}];