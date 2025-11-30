import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Database } from "lucide-react";
import { getTeams, updateTeam } from "@/integrations/admin-model-status/service";
interface Team {
  id: string;
  name: string;
  form_rating?: number | null;
  strength_index?: number | null;
  league_id?: string | null;
}
export function DataConfigurationPanel() {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formRating, setFormRating] = useState<string>("");
  const [strengthIndex, setStrengthIndex] = useState<string>("");
  const {
    data: teams = [],
    isLoading
  } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: getTeams
  });
  const updateTeamMutation = useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: {
        form_rating?: number;
        strength_index?: number;
      };
    }) => updateTeam(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-teams"]
      });
      toast({
        title: "Team Updated",
        description: "Team data has been successfully updated."
      });
      setEditingTeam(null);
    },
    onError: error => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update team data.",
        variant: "destructive"
      });
    }
  });
  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormRating(team.form_rating?.toString() || "");
    setStrengthIndex(team.strength_index?.toString() || "");
  };
  const handleSave = () => {
    if (!editingTeam) return;
    const formRatingValue = parseFloat(formRating);
    const strengthIndexValue = parseFloat(strengthIndex);

    // Validation
    if (formRating && (isNaN(formRatingValue) || formRatingValue < 0 || formRatingValue > 100)) {
      toast({
        title: "Validation Error",
        description: "Form rating must be between 0 and 100.",
        variant: "destructive"
      });
      return;
    }
    if (strengthIndex && (isNaN(strengthIndexValue) || strengthIndexValue < 0 || strengthIndexValue > 100)) {
      toast({
        title: "Validation Error",
        description: "Strength index must be between 0 and 100.",
        variant: "destructive"
      });
      return;
    }
    updateTeamMutation.mutate({
      id: editingTeam.id,
      updates: {
        form_rating: formRating ? formRatingValue : undefined,
        strength_index: strengthIndex ? strengthIndexValue : undefined
      }
    });
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Team Editor
          </CardTitle>
          <CardDescription>
            Manually adjust team ratings that feed into the prediction model
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading teams...</p>
            </div> : <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Form Rating</TableHead>
                    <TableHead>Strength Index</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.slice(0, 20).map((team: Team) => <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.form_rating?.toFixed(1) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {team.strength_index?.toFixed(1) || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(team)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Team Data</DialogTitle>
                              <DialogDescription>
                                Update form rating and strength index for {team.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="form-rating">
                                  Form Rating (0-100)
                                </Label>
                                <Input id="form-rating" type="number" min="0" max="100" step="0.1" value={formRating} onChange={e => setFormRating(e.target.value)} placeholder="Enter form rating" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="strength-index">
                                  Strength Index (0-100)
                                </Label>
                                <Input id="strength-index" type="number" min="0" max="100" step="0.1" value={strengthIndex} onChange={e => setStrengthIndex(e.target.value)} placeholder="Enter strength index" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleSave} disabled={updateTeamMutation.isPending}>
                                {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
          {teams.length > 20 && <p className="mt-4 text-sm text-muted-foreground">
              Showing first 20 teams. Total teams: {teams.length}
            </p>}
        </CardContent>
      </Card>
    </div>;
}