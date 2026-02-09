import React from 'react';

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid background - brutalist aesthetic */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(to right, rgba(255,106,0,0.1) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(255,106,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Main loading content */}
      <div className="relative z-10 text-center space-y-12">
        {/* Brutalist geometric loader */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            {/* Outer square frame - rotating */}
            <div className="absolute inset-0 border-2 border-primary animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-0 w-4 h-4 bg-primary"></div>
            </div>
            
            {/* Middle hexagon - counter-rotating */}
            <div className="absolute inset-4 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <path d="M 20 4 L 36 12 L 36 28 L 20 36 L 4 28 L 4 12 Z" fill="none" stroke="#FF6A00" strokeWidth="2"/>
              </svg>
            </div>
            
            {/* Center node - pulsing */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-primary animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading text - kinetic typography */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold text-primary tracking-tight">
            Loading
            <span className="inline-flex ml-2 font-mono">
              <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: '300ms' }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: '600ms' }}>.</span>
            </span>
          </h1>
          
          <p className="text-sm font-light opacity-60 tracking-wide uppercase">
            Preparing Your Experience
          </p>

          {/* Brutalist progress indicator */}
          <div className="w-64 mx-auto h-1 bg-primary/10 overflow-hidden">
            <div 
              className="h-full bg-primary animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>
        </div>

        {/* Geometric indicators */}
        <div className="flex justify-center space-x-6">
          <div className="w-2 h-2 border border-primary animate-bounce"></div>
          <div className="w-2 h-2 border border-primary animate-bounce" style={{ animationDelay: '100ms' }}></div>
          <div className="w-2 h-2 border border-primary animate-bounce" style={{ animationDelay: '200ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;