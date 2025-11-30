import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const Unauthorized = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page. Please contact an administrator if you think this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => navigate("/")} className="w-full" variant="default">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              If you need access to administrative features, please reach out to your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Unauthorized;