import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useDocumentTitle("404 Not Found • WinMix TipsterHub");
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return <PageLayout>
      <PageHeader title="Page not found" description={`The page "${location.pathname}" does not exist.`} />
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-7xl font-bold text-foreground/80 mb-4">404</div>
        <p className="text-muted-foreground mb-6">Oops! We couldn't find what you're looking for.</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    </PageLayout>;
};
export default NotFound;