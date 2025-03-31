
import React from 'react';
import { DollarSign } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="bg-primary text-primary-foreground p-3 rounded-md mb-4 animate-bounce">
        <DollarSign size={32} />
      </div>
      <h2 className="text-xl font-bold mb-2">Loading SplitEase</h2>
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
