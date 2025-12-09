import { useMemo } from 'react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

const PredictionsReviewWidget = () => {
  const predictions = [
    { id: 1, match: 'Team A vs Team B', prediction: 'Home Win', confidence: 87, result: 'Correct' },
    { id: 2, match: 'Team C vs Team D', prediction: 'Draw', confidence: 62, result: 'Incorrect' },
    { id: 3, match: 'Team E vs Team F', prediction: 'Away Win', confidence: 75, result: 'Correct' },
    { id: 4, match: 'Team G vs Team H', prediction: 'Home Win', confidence: 81, result: 'Pending' },
  ];

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Predictions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Match</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Prediction</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Confidence</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(pred => (
                <tr key={pred.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{pred.match}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{pred.prediction}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-primary">{pred.confidence}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pred.result === 'Correct' ? 'bg-green-500/20 text-green-500' :
                      pred.result === 'Incorrect' ? 'bg-red-500/20 text-red-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {pred.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetGroup>
  );
};

const PredictionReviewPageComponent = () => {
  const widgets = useMemo(() => ({
    predictions: <PredictionsReviewWidget />,
  }), []);

  return (
    <>
      <PageHeader 
        title="Prediction Review" 
        metaDescription="Review and analyze predictions"
      />
      <AppGrid id="prediction_review_page" widgets={widgets} />
    </>
  );
};

export default PredictionReviewPageComponent;
