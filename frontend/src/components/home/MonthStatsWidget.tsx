import React from 'react';
import { Plane, Bed, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface MonthStatsWidgetProps {
  tripsCount?: number;
  nightsCount?: number;
  totalSpend?: number;
}

export const MonthStatsWidget: React.FC<MonthStatsWidgetProps> = ({
  tripsCount = 0,
  nightsCount = 0,
  totalSpend = 0,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-4">
      {/* Title & Sparkline SVG */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-neutral-900">This Month</h3>
        {/* Subtle Ocean Blue sparkline curve */}
        <div className="w-20 h-6">
          <svg viewBox="0 0 80 24" className="w-full h-full stroke-[#1E60FF] fill-none stroke-2">
            <path
              d="M 2 18 Q 20 6, 35 14 T 60 4 T 78 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 3 Metric Columns */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-100">
        {/* Trips */}
        <div className="text-center py-1">
          <div className="flex justify-center mb-1">
            <Plane className="w-4 h-4 text-[#1E60FF] -rotate-45" />
          </div>
          <div className="text-lg font-black text-neutral-900 leading-tight">
            {tripsCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">Trips</div>
        </div>

        {/* Nights */}
        <div className="text-center py-1 border-x border-neutral-100">
          <div className="flex justify-center mb-1">
            <Bed className="w-4 h-4 text-[#1E60FF]" />
          </div>
          <div className="text-lg font-black text-neutral-900 leading-tight">
            {nightsCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">Nights</div>
        </div>

        {/* Total Spend */}
        <div className="text-center py-1">
          <div className="flex justify-center mb-1">
            <IndianRupee className="w-4 h-4 text-[#1E60FF]" />
          </div>
          <div className="text-base sm:text-lg font-black text-neutral-900 leading-tight truncate">
            {formatCurrency(totalSpend, 'INR')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">Total Spend</div>
        </div>
      </div>
    </div>
  );
};
