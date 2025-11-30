import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Upload, Edit, Trash2, Calendar, Trophy, Users, FileText, Search, Filter } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { MatchFormData, CSVImportResult } from "@/types/admin";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Types for matches
interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score?: number;
  away_score?: number;
  halftime_home_score?: number;
  halftime_away_score?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  league?: {
    id: string;
    name: string;
    country: string;
  };
  home_team?: {
    id: string;
    name: string;
  };
  away_team?: {
    id: string;
    name: string;
  };
}
interface League {
  id: string;
  name: string;
  country: string;
  season: string;
}
interface Team {
  id: string;
  name: string;
  league_id: string;
}
const fetchMatches = async (): Promise<Match[]> => {
  const {
    data,
    error
  } = await supabase.from("matches").select(`
      *,
      league:leagues(id, name, country),
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `).order("match_date", {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data || [];
};
const fetchLeagues = async (): Promise<League[]> => {
  const {
    data,
    error
  } = await supabase.from("leagues").select("*").order("name", {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data || [];
};
const fetchTeams = async (leagueId?: string): Promise<Team[]> => {
  let query = supabase.from("teams").select("*");
  if (leagueId) {
    query = query.eq("league_id", leagueId);
  }
  const {
    data,
    error
  } = await query.order("name", {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data || [];
};
const createMatch = async (data: MatchFormData): Promise<Match> => {
  const {
    data: result,
    error
  } = await supabase.from("matches").insert(data).select(`
      *,
      league:leagues(id, name, country),
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `).single();
  if (error) throw new Error(error.message);
  return result;
};
const updateMatch = async (id: string, data: Partial<MatchFormData>): Promise<Match> => {
  const {
    data: result,
    error
  } = await supabase.from("matches").update(data).eq("id", id).select(`
      *,
      league:leagues(id, name, country),
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `).single();
  if (error) throw new Error(error.message);
  return result;
};
const deleteMatch = async (id: string): Promise<void> => {
  const {
    error
  } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
const importFromCSV = async (csvContent: string): Promise<CSVImportResult> => {
  const {
    data,
    error
  } = await supabase.functions.invoke<CSVImportResult>("admin-import-matches-csv", {
    body: {
      content: csvContent
    }
  });
  if (error) throw new Error(error.message);
  return data || {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: []
  };
};
export default function MatchesPage() {
  useDocumentTitle("Matches • WinMix TipsterHub");
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [csvFileContent, setCsvFileContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const matchesQuery = useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches
  });
  const leaguesQuery = useQuery({
    queryKey: ["leagues"],
    queryFn: fetchLeagues
  });
  const teamsQuery = useQuery({
    queryKey: ["teams", selectedLeague],
    queryFn: () => fetchTeams(selectedLeague === "all" ? undefined : selectedLeague),
    enabled: !!selectedLeague
  });
  const createMutation = useMutation({
    mutationFn: createMatch,
    onSuccess: () => {
      toast.success("Match created successfully");
      queryClient.invalidateQueries({
        queryKey: ["matches"]
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string;
      data: Partial<MatchFormData>;
    }) => updateMatch(id, data),
    onSuccess: () => {
      toast.success("Match updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["matches"]
      });
      setIsEditDialogOpen(false);
      setSelectedMatch(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => {
      toast.success("Match deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["matches"]
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const importMutation = useMutation({
    mutationFn: importFromCSV,
    onSuccess: result => {
      toast.success(`Imported ${result.imported} of ${result.total} matches`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during import`);
      }
      queryClient.invalidateQueries({
        queryKey: ["matches"]
      });
      setIsImportDialogOpen(false);
      setCsvFileContent("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const [formData, setFormData] = useState<MatchFormData>({
    league_id: "",
    home_team_id: "",
    away_team_id: "",
    match_date: "",
    venue: "",
    status: "scheduled",
    home_score: null,
    away_score: null,
    halftime_home_score: null,
    halftime_away_score: null
  });
  const resetForm = () => {
    setFormData({
      league_id: "",
      home_team_id: "",
      away_team_id: "",
      match_date: "",
      venue: "",
      status: "scheduled",
      home_score: null,
      away_score: null,
      halftime_home_score: null,
      halftime_away_score: null
    });
  };
  const handleEdit = (match: Match) => {
    setSelectedMatch(match);
    setFormData({
      league_id: match.league_id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date,
      venue: match.venue || "",
      status: match.status,
      home_score: match.home_score ?? null,
      away_score: match.away_score ?? null,
      halftime_home_score: match.halftime_home_score ?? null,
      halftime_away_score: match.halftime_away_score ?? null
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this match?")) {
      deleteMutation.mutate(id);
    }
  };
  const handleCSVFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        setCsvFileContent(content);
      };
      reader.readAsText(file);
    }
  };
  const exportToCSV = () => {
    const matches = matchesQuery.data || [];
    const headers = ["League", "Home Team", "Away Team", "Match Date", "Venue", "Status", "Home Score", "Away Score"];
    const rows = matches.map(match => [match.league?.name || "", match.home_team?.name || "", match.away_team?.name || "", match.match_date, match.venue || "", match.status, match.home_score ?? "", match.away_score ?? ""]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matches.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportToJSON = () => {
    const matches = matchesQuery.data || [];
    const cleaned = matches.map(m => ({
      id: m.id,
      league_id: m.league_id,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      match_date: m.match_date,
      venue: m.venue,
      status: m.status,
      home_score: m.home_score ?? null,
      away_score: m.away_score ?? null,
      halftime_home_score: m.halftime_home_score ?? null,
      halftime_away_score: m.halftime_away_score ?? null
    }));
    const blob = new Blob([JSON.stringify(cleaned, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matches.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const formErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.league_id) errors.push("League is required");
    if (!formData.home_team_id) errors.push("Home team is required");
    if (!formData.away_team_id) errors.push("Away team is required");
    if (formData.home_team_id && formData.away_team_id && formData.home_team_id === formData.away_team_id) {
      errors.push("Home and away teams must be different");
    }
    if (!formData.match_date || isNaN(new Date(formData.match_date).getTime())) {
      errors.push("Valid match date is required");
    }
    const isCompleted = formData.status === 'completed' || formData.status === 'finished';
    const hs = formData.home_score;
    const as = formData.away_score;
    if (isCompleted) {
      if (hs === null || as === null || Number.isNaN(hs as number) || Number.isNaN(as as number)) {
        errors.push("Completed matches must include both scores");
      }
    }
    if (hs !== null && hs < 0) errors.push("Home score cannot be negative");
    if (as !== null && as < 0) errors.push("Away score cannot be negative");
    if (formData.halftime_home_score !== null && hs !== null && formData.halftime_home_score > hs) {
      errors.push("Halftime home score cannot exceed final home score");
    }
    if (formData.halftime_away_score !== null && as !== null && formData.halftime_away_score > as) {
      errors.push("Halftime away score cannot exceed final away score");
    }
    return errors;
  }, [formData]);
  const buildPayload = (): MatchFormData => {
    return {
      league_id: formData.league_id,
      home_team_id: formData.home_team_id,
      away_team_id: formData.away_team_id,
      match_date: formData.match_date,
      venue: formData.venue,
      status: formData.status,
      home_score: formData.home_score ?? null,
      away_score: formData.away_score ?? null,
      halftime_home_score: formData.halftime_home_score ?? null,
      halftime_away_score: formData.halftime_away_score ?? null
    };
  };
  const filteredMatches = useMemo(() => {
    const matches = matchesQuery.data || [];
    return matches.filter(match => {
      const matchesSearch = match.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) || match.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) || match.league?.name.toLowerCase().includes(searchTerm.toLowerCase()) || match.venue?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = selectedLeague === "all" || match.league_id === selectedLeague;
      const matchesStatus = selectedStatus === "all" || match.status === selectedStatus;
      return matchesSearch && matchesLeague && matchesStatus;
    });
  }, [matchesQuery.data, searchTerm, selectedLeague, selectedStatus]);
  const stats = useMemo(() => {
    const matches = filteredMatches;
    return {
      total: matches.length,
      scheduled: matches.filter(m => m.status === 'scheduled').length,
      live: matches.filter(m => m.status === 'live').length,
      completed: matches.filter(m => m.status === 'completed').length,
      cancelled: matches.filter(m => m.status === 'cancelled').length
    };
  }, [filteredMatches]);
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "default",
      live: "destructive",
      completed: "secondary",
      cancelled: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };
  return <AuthGate allowedRoles={['admin', 'analyst']}>
      <PageLayout>
        <PageHeader title="Matches Management" description="Manage matches and import data from CSV files" actions={<>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportToJSON}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Match
              </Button>
            </>} />

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Matches from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file with match data. Expected columns: League, Home Team, Away Team, Match Date, Venue, Status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleCSVFileUpload} />
              </div>
              {csvFileContent && <div>
                  <Label htmlFor="csv-preview">Preview</Label>
                  <Textarea id="csv-preview" value={csvFileContent} onChange={e => setCsvFileContent(e.target.value)} rows={10} placeholder="CSV content will appear here..." />
                </div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => importMutation.mutate(csvFileContent)} disabled={importMutation.isPending || !csvFileContent.trim()}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Match</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="league">League</Label>
                <Select value={formData.league_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                league_id: value
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaguesQuery.data?.map(league => <SelectItem key={league.id} value={league.id}>
                        {league.name} ({league.country})
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="home-team">Home Team</Label>
                <Select value={formData.home_team_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                home_team_id: value
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsQuery.data?.filter(team => team.id !== formData.away_team_id).map(team => <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="away-team">Away Team</Label>
                <Select value={formData.away_team_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                away_team_id: value
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsQuery.data?.filter(team => team.id !== formData.home_team_id).map(team => <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="match-date">Match Date</Label>
                <Input id="match-date" type="datetime-local" value={formData.match_date} onChange={e => setFormData(prev => ({
                ...prev,
                match_date: e.target.value
              }))} />
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" value={formData.venue} onChange={e => setFormData(prev => ({
                ...prev,
                venue: e.target.value
              }))} placeholder="Stadium name" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: NonNullable<MatchFormData["status"]>) => setFormData(prev => ({
                ...prev,
                status: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="home-score">Home Score</Label>
                  <Input id="home-score" type="number" min={0} value={formData.home_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    home_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                </div>
                <div>
                  <Label htmlFor="away-score">Away Score</Label>
                  <Input id="away-score" type="number" min={0} value={formData.away_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    away_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ht-home-score">HT Home Score</Label>
                  <Input id="ht-home-score" type="number" min={0} value={formData.halftime_home_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    halftime_home_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                </div>
                <div>
                  <Label htmlFor="ht-away-score">HT Away Score</Label>
                  <Input id="ht-away-score" type="number" min={0} value={formData.halftime_away_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    halftime_away_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                </div>
              </div>
              {formErrors.length > 0 && <Alert variant="destructive">
                  <AlertDescription>
                    {formErrors.map((err, idx) => <div key={idx}>{err}</div>)}
                  </AlertDescription>
                </Alert>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate(buildPayload())} disabled={createMutation.isPending || !formData.league_id || !formData.home_team_id || !formData.away_team_id || !formData.match_date || formErrors.length > 0}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.scheduled}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Live</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats.live}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.cancelled}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-card/60 border-border/80 backdrop-blur mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search matches..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                      <SelectTrigger>
                        <SelectValue placeholder="All leagues" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leagues</SelectItem>
                        {leaguesQuery.data?.map(league => <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matches Table */}
            <Card className="bg-card/60 border-border/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Matches
                  <Badge variant="secondary">{filteredMatches.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>League</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map(match => <TableRow key={match.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(match.match_date).toLocaleDateString()} {new Date(match.match_date).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            {match.league?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{match.home_team?.name}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span>{match.away_team?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {match.venue || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(match.status)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {match.home_score !== null && match.away_score !== null ? `${match.home_score} - ${match.away_score}` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(match)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(match.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Match</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-league">League</Label>
                    <Select value={formData.league_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                league_id: value
              }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select league" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaguesQuery.data?.map(league => <SelectItem key={league.id} value={league.id}>
                            {league.name} ({league.country})
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-home-team">Home Team</Label>
                    <Select value={formData.home_team_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                home_team_id: value
              }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsQuery.data?.filter(team => team.id !== formData.away_team_id).map(team => <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-away-team">Away Team</Label>
                    <Select value={formData.away_team_id} onValueChange={value => setFormData(prev => ({
                ...prev,
                away_team_id: value
              }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsQuery.data?.filter(team => team.id !== formData.home_team_id).map(team => <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-match-date">Match Date</Label>
                    <Input id="edit-match-date" type="datetime-local" value={formData.match_date} onChange={e => setFormData(prev => ({
                ...prev,
                match_date: e.target.value
              }))} />
                  </div>
                  <div>
                    <Label htmlFor="edit-venue">Venue</Label>
                    <Input id="edit-venue" value={formData.venue} onChange={e => setFormData(prev => ({
                ...prev,
                venue: e.target.value
              }))} placeholder="Stadium name" />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: NonNullable<MatchFormData["status"]>) => setFormData(prev => ({
                ...prev,
                status: value
              }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-home-score">Home Score</Label>
                      <Input id="edit-home-score" type="number" min={0} value={formData.home_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    home_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                    </div>
                    <div>
                      <Label htmlFor="edit-away-score">Away Score</Label>
                      <Input id="edit-away-score" type="number" min={0} value={formData.away_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    away_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-ht-home-score">HT Home Score</Label>
                      <Input id="edit-ht-home-score" type="number" min={0} value={formData.halftime_home_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    halftime_home_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                    </div>
                    <div>
                      <Label htmlFor="edit-ht-away-score">HT Away Score</Label>
                      <Input id="edit-ht-away-score" type="number" min={0} value={formData.halftime_away_score ?? ""} onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    halftime_away_score: val === "" ? null : Number.parseInt(val, 10)
                  }));
                }} />
                    </div>
                  </div>
                  {formErrors.length > 0 && <Alert variant="destructive">
                      <AlertDescription>
                        {formErrors.map((err, idx) => <div key={idx}>{err}</div>)}
                      </AlertDescription>
                    </Alert>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => selectedMatch && updateMutation.mutate({
              id: selectedMatch.id,
              data: buildPayload()
            })} disabled={updateMutation.isPending || !formData.league_id || !formData.home_team_id || !formData.away_team_id || !formData.match_date || formErrors.length > 0}>
                    Update
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </PageLayout>
    </AuthGate>;
}