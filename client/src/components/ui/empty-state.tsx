import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

// HRAI Logo Component
const HRAILogo = () => (
  <svg 
    width="80" 
    height="80" 
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
);

export const EmptyState = ({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Icon Container */}
      <div className="mb-8 relative">
        {/* Background geometric frame */}
        <div className="absolute inset-0 -m-6 border-2 border-primary/10"></div>
        
        {/* Icon or Logo */}
        <div className="relative z-10">
          {Icon ? (
            <div className="w-24 h-24 border-2 border-primary/20 flex items-center justify-center">
              <Icon size={48} className="text-primary" strokeWidth={1.5} />
            </div>
          ) : (
            <HRAILogo />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-y-4 max-w-md mx-auto text-center mb-8">
        <h6 className="text-2xl font-semibold text-primary tracking-tight">
          {title}
        </h6>
        <p className="text-sm font-light leading-relaxed opacity-80">
          {description}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              className="h-12 px-8 bg-primary hover:bg-white hover:text-primary border-2 border-primary text-white font-light tracking-widest uppercase text-sm transition-all"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="h-12 px-8 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-light tracking-widest uppercase text-sm transition-all"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Decorative elements */}
      <div className="flex gap-4 mt-8">
        <div className="w-2 h-2 border border-primary/30"></div>
        <div className="w-2 h-2 border border-primary/30"></div>
        <div className="w-2 h-2 border border-primary/30"></div>
      </div>
    </div>
  );
};