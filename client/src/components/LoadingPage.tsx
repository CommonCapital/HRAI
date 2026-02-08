import React from 'react';

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center relative overflow-hidden">
      {/* Background animated circles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-500/15 rounded-full animate-pulse delay-300"></div>
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-blue-400/10 rounded-full animate-pulse delay-700"></div>
      </div>
      
      {/* Main loading content */}
      <div className="relative z-10 text-center space-y-8 animate-fade-in">
        {/* Loading spinner */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-24 h-24 border-4 border-blue-300/30 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-6 h-6 bg-blue-200 rounded-full"></div>
            </div>
            {/* Inner ring */}
            <div className="absolute inset-2 w-16 h-16 border-4 border-blue-400/40 rounded-full animate-spin delay-150">
              <div className="absolute top-0 left-0 w-4 h-4 bg-blue-300 rounded-full"></div>
            </div>
            {/* Center dot */}
            <div className="absolute inset-1/2 w-2 h-2 bg-blue-100 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Loading
            <span className="inline-flex ml-2">
              <span className="animate-pulse delay-100">.</span>
              <span className="animate-pulse delay-300">.</span>
              <span className="animate-pulse delay-500">.</span>
            </span>
          </h1>
          
          <p className="text-blue-100 text-lg md:text-xl font-light max-w-md mx-auto leading-relaxed">
            Preparing your experience
          </p>
          
          {/* Progress bar */}
          <div className="w-64 mx-auto bg-blue-700/50 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="flex justify-center space-x-4 opacity-60">
          <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-200 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
      
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900 to-transparent"></div>
    </div>
  );
};

export default LoadingPage;
