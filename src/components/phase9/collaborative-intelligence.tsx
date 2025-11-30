// Phase 9: Collaborative Intelligence Components

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CollaborativeIntelligenceService } from '@/lib/phase9-api';
import type { UserPredictionForm as UserPredictionFormData, UserPredictionFormProps } from '@/types/phase9';

// Form validation schema
const predictionSchema = z.object({
  predicted_outcome: z.enum(['home_win', 'draw', 'away_win']),
  confidence_score: z.number().min(0).max(100),
  predicted_home_score: z.number().min(0).max(10).optional(),
  predicted_away_score: z.number().min(0).max(10).optional(),
  btts_prediction: z.boolean().optional(),
  over_under_prediction: z.enum(['over_2.5', 'under_2.5']).optional(),
  reasoning: z.string().max(500).optional()
});
export const UserPredictionForm: React.FC<UserPredictionFormProps> = ({
  matchId,
  onSubmit,
  isLoading = false,
  disabled = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors,
      isValid
    }
  } = useForm<UserPredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      predicted_outcome: 'home_win',
      confidence_score: 75,
      btts_prediction: false,
      over_under_prediction: 'over_2.5'
    }
  });
  const confidenceScore = watch('confidence_score');
  const predictedOutcome = watch('predicted_outcome');
  const handleFormSubmit = async (data: UserPredictionFormData) => {
    setIsSubmitting(true);
    try {
      const result = await CollaborativeIntelligenceService.submitUserPrediction({
        ...data,
        match_id: matchId
      }, 'anonymous' // In production, get from auth
      );
      if (result.success) {
        toast({
          title: 'Prediction submitted successfully!',
          description: 'Your prediction has been added to the crowd wisdom.'
        });
        onSubmit?.(data);
      } else {
        toast({
          title: 'Failed to submit prediction',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };
  return <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Submit Your Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Main Prediction */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="predicted_outcome">Match Outcome</Label>
              <Select value={predictedOutcome} onValueChange={value => setValue('predicted_outcome', value as 'home_win' | 'draw' | 'away_win')} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_win">Home Win</SelectItem>
                  <SelectItem value="draw">Draw</SelectItem>
                  <SelectItem value="away_win">Away Win</SelectItem>
                </SelectContent>
              </Select>
              {errors.predicted_outcome && <p className="text-sm text-red-600 mt-1">{errors.predicted_outcome.message}</p>}
            </div>

            <div>
              <Label htmlFor="confidence_score">Confidence Score: {confidenceScore}%</Label>
              <div className="space-y-2">
                <Slider value={[confidenceScore]} onValueChange={value => setValue('confidence_score', value[0])} max={100} step={1} disabled={disabled} className="w-full" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Low</span>
                  <Badge variant="outline" className={`${getConfidenceColor(confidenceScore)} border-current`}>
                    {getConfidenceLabel(confidenceScore)}
                  </Badge>
                  <span className="text-green-600">High</span>
                </div>
              </div>
              {errors.confidence_score && <p className="text-sm text-red-600 mt-1">{errors.confidence_score.message}</p>}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Advanced Options</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} disabled={disabled}>
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {showAdvanced && <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="predicted_home_score">Home Score</Label>
                    <Input id="predicted_home_score" type="number" min="0" max="10" placeholder="0-10" {...register('predicted_home_score', {
                  valueAsNumber: true
                })} disabled={disabled} />
                  </div>
                  <div>
                    <Label htmlFor="predicted_away_score">Away Score</Label>
                    <Input id="predicted_away_score" type="number" min="0" max="10" placeholder="0-10" {...register('predicted_away_score', {
                  valueAsNumber: true
                })} disabled={disabled} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Both Teams to Score?</Label>
                    <Select value={watch('btts_prediction')?.toString() || 'false'} onValueChange={value => setValue('btts_prediction', value === 'true')} disabled={disabled}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Total Goals</Label>
                    <Select value={watch('over_under_prediction')} onValueChange={value => setValue('over_under_prediction', value as 'over_2.5' | 'under_2.5')} disabled={disabled}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="over_2.5">Over 2.5</SelectItem>
                        <SelectItem value="under_2.5">Under 2.5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reasoning">Reasoning (optional)</Label>
                  <Textarea id="reasoning" placeholder="Explain your prediction..." rows={3} {...register('reasoning')} disabled={disabled} />
                  <p className="text-xs text-gray-500 mt-1">
                    {watch('reasoning')?.length || 0}/500 characters
                  </p>
                </div>
              </div>}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!isValid || isSubmitting || disabled || isLoading}>
            {isSubmitting ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </> : <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Submit Prediction
              </>}
          </Button>
        </form>
      </CardContent>
    </Card>;
};