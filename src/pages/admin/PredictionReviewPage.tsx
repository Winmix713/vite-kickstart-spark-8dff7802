import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionReviewPanel } from "@/components/admin/model-status/PredictionReviewPanel";
import { AlertCircle } from "lucide-react";
const HUNGARIAN_LABELS = {
  title: "Előrejelzés-felülvizsgálati panel",
  subtitle: "Blokkolt és túlzottan magabiztos előrejelzések triázs felülete",
  info_title: "Információ",
  info_desc: "Ez az oldal lehetővé teszi az adminisztrátoroknak, hogy felülvizsgálják az olyan előrejelzéseket, amelyeket túlzott magabiztosság miatt blokkolt a rendszer. Az \"Elfogadás\" gomb az előrejelzést blokkolt státuszban hagyja, az \"Elutasítás\" gomb pedig visszaállítja az aktív státuszra."
};
export default function PredictionReviewPage() {
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{HUNGARIAN_LABELS.title}</h1>
          <p className="text-muted-foreground mt-2">{HUNGARIAN_LABELS.subtitle}</p>
        </div>
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            {HUNGARIAN_LABELS.info_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{HUNGARIAN_LABELS.info_desc}</p>
        </CardContent>
      </Card>

      {/* Prediction Review Panel */}
      <PredictionReviewPanel autoRefresh={true} refreshInterval={30000} />
    </div>;
}