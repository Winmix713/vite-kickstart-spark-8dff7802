import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-card ring-1 ring-border overflow-hidden p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Please contact an administrator if you think this is an error.
          </p>

          <button 
            onClick={() => navigate('/')}
            className="w-full mb-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>

          <p className="text-xs text-muted-foreground">
            If you need access to administrative features, please reach out to your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
