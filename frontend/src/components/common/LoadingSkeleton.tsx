import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-12"></div>
      </div>
      <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 rounded"></div>
        <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
      </div>
      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
        <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
        <div className="h-7 bg-neutral-200 rounded-lg w-20"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="h-10 bg-neutral-200 rounded-xl w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
};
