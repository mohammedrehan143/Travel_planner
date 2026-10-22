import React from 'react';
import { Trip, TripDay, Activity, TripExpense } from '../../types';
import { Printer, X, Compass, Calendar, DollarSign, MapPin, Clock } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface PDFExportViewProps {
  trip: Trip;
  days: TripDay[];
  activitiesByDay: Record<string, Activity[]>;
  expenses: TripExpense[];
  onClose: () => void;
}

export const PDFExportView: React.FC<PDFExportViewProps> = ({
  trip,
  days,
  activitiesByDay,
  expenses,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalSpent = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Top action bar - Hidden during print */}
      <div className="sticky top-0 z-50 no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm">TripPilot AI Document Export Preview</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="max-w-4xl mx-auto p-8 sm:p-12 space-y-8 bg-white print:p-0">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-wrap justify-between items-start gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              TripPilot AI Official Travel Itinerary
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-1">{trip.title}</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-xl">{trip.description}</p>
          </div>

          <div className="text-right text-xs space-y-1">
            <p className="font-bold text-slate-900">Destination: {trip.destination}</p>
            <p className="text-slate-600">Origin: {trip.origin}</p>
            <p className="text-slate-600">
              Dates: {trip.start_date} to {trip.end_date} ({trip.duration_days} Days)
            </p>
            <p className="text-slate-600">Travelers: {trip.traveler_count}</p>
            <p className="font-semibold text-blue-700">
              Budget: {formatCurrency(trip.total_budget, trip.currency, true)}
            </p>
          </div>
        </div>

        {/* Days & Schedules */}
        <div className="space-y-8">
          {days.map((day) => {
            const dayActs = activitiesByDay[day.id] || [];
            return (
              <div key={day.id} className="space-y-4 break-inside-avoid">
                <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Day {day.day_number}: {day.theme}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">{day.date}</span>
                </div>

                {day.summary && (
                  <p className="text-xs italic text-slate-600">{day.summary}</p>
                )}

                <div className="space-y-3">
                  {dayActs.map((act, idx) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600">#{idx + 1}</span>
                          <span className="font-bold text-slate-900 text-sm">{act.title}</span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {act.category}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700">
                          {act.start_time} - {act.end_time}
                        </span>
                      </div>

                      {act.description && (
                        <p className="text-xs text-slate-600">{act.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {act.location_name} {act.location_address ? `• ${act.location_address}` : ''}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {act.estimated_cost === 0
                            ? 'Free'
                            : `Est. ${formatCurrency(act.estimated_cost, act.currency || trip.currency)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget Summary Table */}
        <div className="pt-6 border-t-2 border-slate-200 break-inside-avoid">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Financial & Expense Breakdown
          </h4>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500">
                <th className="py-2">Item</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 font-medium text-slate-800">{e.description}</td>
                  <td className="py-2 capitalize text-slate-500">{e.category}</td>
                  <td className="py-2 text-right font-bold text-slate-900">
                    {formatCurrency(e.amount, e.currency || trip.currency)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 font-bold">
                <td className="py-2" colSpan={2}>Total Estimated Expenditure</td>
                <td className="py-2 text-right text-blue-700">
                  {formatCurrency(totalSpent, trip.currency, true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Generated automatically by TripPilot AI • Supabase Connected • Confidential Itinerary
        </div>
      </div>
    </div>
  );
};
