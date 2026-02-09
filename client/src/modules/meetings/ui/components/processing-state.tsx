import Processing from "../../../../../public/processing"

export const ProcessingState = () => {
  return (
    <div 
      className="bg-white rounded border border-[rgba(255,106,0,0.1)] p-8 flex flex-col gap-y-6 items-center justify-center min-h-[400px]"
      style={{ boxShadow: '0 2px 8px rgba(255,106,0,0.08)' }}
    >
      <div className="text-[#FF6A00] w-16 h-16 animate-pulse">
        <Processing />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[#FF6A00] tracking-tight">Processing Complete</h2>
        <p className="text-[rgba(255,106,0,0.6)] font-light mt-2 leading-relaxed">
          Your task has been successfully completed. The data report will appear shortly.
        </p>
      </div>
    </div>
  );
};