import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
interface LogEntry {
  ts: string;
  level: string;
  message: string;
  data?: unknown;
}
export default function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  useEffect(() => {
    const handler = (e: CustomEvent<LogEntry>) => {
      setLogs(prev => [e.detail, ...prev].slice(0, 200));
    };
    window.addEventListener("app:log", handler as EventListener);
    return () => window.removeEventListener("app:log", handler as EventListener);
  }, []);
  return <Card className="border-border/60 bg-muted/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Debug Console</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setLogs([])}>Clear</Button>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-auto font-mono text-xs space-y-2">
          {logs.length === 0 ? <div className="text-muted-foreground">No logs</div> : logs.map((l, i) => <div key={i} className="break-all">
                <span className="text-muted-foreground">[{l.ts}]</span> <span className="uppercase">{l.level}</span> {l.message}
                {l.data ? <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(l.data, null, 2)}</pre> : null}
              </div>)}
        </div>
      </CardContent>
    </Card>;
}