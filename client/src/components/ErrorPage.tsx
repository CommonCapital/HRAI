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
    <div className="min-h-screen bg-gradient-radial from-blue-800 to-blue-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Error icon with animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <AlertTriangle 
              size={120} 
              className="animate-bounce text-blue-200"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-ping"></div>
          </div>
        </div>

        {/* Error title */}
        <h1 className="text-8xl md:text-9xl font-bold text-blue-200 mb-4 tracking-wider">
          {title}
        </h1>

        {/* Error message */}
        <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
          >
            <Home size={20} />
            Go Home
          </Button>

          {showRefresh && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-blue-300 text-blue-100 hover:bg-blue-700/20 hover:border-blue-200 px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Try Again
            </Button>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-12 text-blue-200/70 text-sm">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-300 rounded-full animate-twinkle"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-blue-200 rounded-full animate-twinkle delay-500"></div>
      <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-blue-400 rounded-full animate-twinkle delay-1000"></div>
    </div>
  );
};

export default ErrorPage;
