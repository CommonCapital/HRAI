import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Error",
  message = "Oops! Something went wrong.",
  showRefresh = true,
  onRefresh
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Grid background - brutalist */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(to right, rgba(255,106,0,0.1) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(255,106,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Error icon - geometric, minimal */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            {/* Outer frame */}
            <div className="w-32 h-32 border-4 border-primary flex items-center justify-center">
              <AlertTriangle 
                size={64} 
                className="text-primary"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        {/* Error title - brutalist typography */}
        <h1 className="text-7xl md:text-8xl font-semibold text-primary mb-6 tracking-tight font-mono">
          {title}
        </h1>

        {/* Error message */}
        <p className="text-lg md:text-xl font-light opacity-80 mb-12 leading-relaxed max-w-md mx-auto">
          {message}
        </p>

        {/* Action buttons - minimal, decisive */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => window.location.href = '/'}
            className="h-12 bg-primary hover:bg-white hover:text-primary border-2 border-primary text-white px-8 font-light tracking-widest uppercase text-sm transition-all"
          >
            <Home size={18} strokeWidth={1.5} className="mr-2" />
            Go Home
          </Button>
          
          {showRefresh && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="h-12 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary px-8 font-light tracking-widest uppercase text-sm transition-all"
            >
              <RefreshCw size={18} strokeWidth={1.5} className="mr-2" />
              Try Again
            </Button>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-sm font-light opacity-60">
          <p className="uppercase tracking-wide text-xs">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>

      {/* Decorative corner elements - geometric */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/20"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/20"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/20"></div>
    </div>
  );
};

export default ErrorPage;