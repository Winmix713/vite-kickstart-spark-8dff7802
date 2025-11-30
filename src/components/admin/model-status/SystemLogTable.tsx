import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface SystemLog {
  id: string;
  component: string;
  status: "info" | "warning" | "error";
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
}
const fetchSystemLogs = async (): Promise<SystemLog[]> => {
  const {
    data,
    error
  } = await supabase.from("system_logs").select("*").order("created_at", {
    ascending: false
  }).limit(10);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};
const getStatusIcon = (status: string) => {
  switch (status) {
    case "error":
      return <AlertCircle className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "info":
    default:
      return <Info className="h-4 w-4" />;
  }
};
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "error":
      return "destructive";
    case "warning":
      return "outline";
    case "info":
    default:
      return "secondary";
  }
};
const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
};
export function SystemLogTable() {
  const {
    toast
  } = useToast();
  const {
    data: logs,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["system-logs"],
    queryFn: fetchSystemLogs,
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Frissítve",
        description: "A rendszernapló sikeresen frissítve."
      });
    } catch (err) {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a rendszernaplót.",
        variant: "destructive"
      });
    }
  };
  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>Rendszernapló</CardTitle>
          <CardDescription>
            Hiba történt a rendszernapló betöltése közben
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error instanceof Error ? error.message : "Ismeretlen hiba"}</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rendszernapló</CardTitle>
            <CardDescription>
              Legutóbbi 10 bejegyzés a Python ML pipeline-ból
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Frissítés</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">Betöltés...</span>
          </div> : logs && logs.length > 0 ? <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Időpont</TableHead>
                  <TableHead className="w-[140px]">Komponens</TableHead>
                  <TableHead className="w-[100px]">Státusz</TableHead>
                  <TableHead>Üzenet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => <TableRow key={log.id} className={log.status === "error" ? "bg-destructive/5" : ""}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.component}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(log.status)} className={log.status === "warning" ? "border-amber-500 text-amber-700" : ""}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                          {log.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.message || "N/A"}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div> : <div className="py-8 text-center text-muted-foreground">
            Nincsenek napló bejegyzések
          </div>}
      </CardContent>
    </Card>;
}