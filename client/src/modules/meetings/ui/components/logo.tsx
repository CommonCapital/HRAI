import React from 'react';

interface HRAILogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'minimal' | 'icon-only';
  className?: string;
}

/**
 * HRAI Logo - Brutalist Geometric Design
 * 
 * Design Concept:
 * - Outer square frame: Represents structure and control
 * - Hexagonal core: AI intelligence and decision-making
 * - Central node: The autonomous decision point
 * - Connection lines: Workflow automation paths
 * 
 * Colors: Pure orange (#FF6A00) on white
 */
export const HRAILogo: React.FC<HRAILogoProps> = ({ 
  size = 40, 
  showText = true,
  variant = 'default',
  className = ''
}) => {
  
  // Icon only variant
  if (variant === 'icon-only') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect 
          x="2" 
          y="2" 
          width="36" 
          height="36" 
          stroke="#FF6A00" 
          strokeWidth="2"
          fill="none"
        />
        <path 
          d="M 20 8 L 32 14 L 32 26 L 20 32 L 8 26 L 8 14 Z" 
          fill="#FF6A00"
        />
        <circle 
          cx="20" 
          cy="20" 
          r="4" 
          fill="white"
        />
        <line x1="20" y1="8" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="24" x2="20" y2="32" stroke="white" strokeWidth="1.5" />
        <line x1="8" y1="14" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
        <line x1="24" y1="22" x2="32" y2="26" stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }
  
  // Minimal variant (smaller text)
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <svg 
          width={size * 0.8} 
          height={size * 0.8} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect 
            x="2" 
            y="2" 
            width="36" 
            height="36" 
            stroke="#FF6A00" 
            strokeWidth="2"
            fill="none"
          />
          <path 
            d="M 20 8 L 32 14 L 32 26 L 20 32 L 8 26 L 8 14 Z" 
            fill="#FF6A00"
          />
          <circle 
            cx="20" 
            cy="20" 
            r="4" 
            fill="white"
          />
          <line x1="20" y1="8" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
          <line x1="20" y1="24" x2="20" y2="32" stroke="white" strokeWidth="1.5" />
          <line x1="8" y1="14" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
          <line x1="24" y1="22" x2="32" y2="26" stroke="white" strokeWidth="1.5" />
        </svg>
        <span className="text-lg font-semibold tracking-tight text-primary">HRAI</span>
      </div>
    );
  }
  
  // Default variant (full logo with text)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer frame - represents structure */}
        <rect 
          x="2" 
          y="2" 
          width="36" 
          height="36" 
          stroke="#FF6A00" 
          strokeWidth="2"
          fill="none"
        />
        
        {/* Inner geometric pattern - represents AI intelligence */}
        <path 
          d="M 20 8 L 32 14 L 32 26 L 20 32 L 8 26 L 8 14 Z" 
          fill="#FF6A00"
        />
        
        {/* Central node - represents decision point */}
        <circle 
          cx="20" 
          cy="20" 
          r="4" 
          fill="white"
        />
        
        {/* Connection lines - represents autonomous workflow */}
        <line x1="20" y1="8" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
        <line x1="20" y1="24" x2="20" y2="32" stroke="white" strokeWidth="1.5" />
        <line x1="8" y1="14" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
        <line x1="24" y1="22" x2="32" y2="26" stroke="white" strokeWidth="1.5" />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-semibold tracking-tight text-primary">HRAI</span>
          <span className="text-[10px] uppercase tracking-widest font-light opacity-60 mt-0.5">
            Autonomous HR
          </span>
        </div>
      )}
    </div>
  );
};

// Export variations for convenience
export const HRAILogoIcon = () => <HRAILogo variant="icon-only" />;
export const HRAILogoMinimal = () => <HRAILogo variant="minimal" />;
export const HRAILogoFull = () => <HRAILogo variant="default" />;