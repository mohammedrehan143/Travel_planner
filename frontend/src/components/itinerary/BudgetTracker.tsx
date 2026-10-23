import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  Plane
} from 'lucide-react';
import { Trip, TripExpense, ExpenseCategory } from '../../types';
import { useTrips } from '../../context/TripContext';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';

interface BudgetTrackerProps {
  trip: Trip;
  expenses: TripExpense[];
}

// Mono & Orange brand palette for chart categories
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  flights: '#F97316',        // Primary Orange
  accommodation: '#171717',  // Pitch Black / Dark Neutral
  food: '#EA580C',           // Darker Orange
  activities: '#525252',     // Neutral Gray 600
  transport: '#FB923C',      // Light Orange
  shopping: '#737373',       // Medium Gray 500
  insurance: '#A3A3A3',      // Light Slate 400
  other: '#D4D4D4',          // Soft Gray 300
};

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ trip, expenses }) => {
  const { addExpense, deleteExpense } = useTrips();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [showAddForm, setShowAddForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Aggregate spending by category
  const categoryTotals: Record<ExpenseCategory, number> = {
    flights: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    transport: 0,
    shopping: 0,
    insurance: 0,
    other: 0,
  };

  expenses.forEach((exp) => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += Number(exp.amount) || 0;
    } else {
      categoryTotals.other += Number(exp.amount) || 0;
    }
  });

  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const budget = Number(trip.total_budget) || 1;
  const remaining = budget - totalSpent;
  const percentSpent = Math.min(100, Math.round((totalSpent / budget) * 100));

  // Prepare chart data
  const chartData = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .map(([cat, val]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: Math.round(val),
      color: CATEGORY_COLORS[cat as ExpenseCategory] || '#737373',
    }));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;

    addExpense({
      trip_id: trip.id,
      category,
      amount: parseFloat(amount),
      currency: trip.currency,
      description: desc,
      date,
    });

    setDesc('');
    setAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6 space-y-6">
      {/* Title & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h3 className="text-lg font-bold text-[#171717] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#F97316]" />
            Trip Budget & Expense Tracker
          </h3>
          <p className="text-xs text-[#525252]">
            Real-time financial breakdown across flights, lodging, dining, and activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart view toggle */}
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1 text-xs border border-[#E5E7EB]">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartType === 'pie' ? 'bg-white text-[#171717] shadow-sm border border-[#E5E7EB]' : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Pie</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartType === 'bar' ? 'bg-white text-[#171717] shadow-sm border border-[#E5E7EB]' : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Flight Estimate Overview Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#171717] text-[#F97316] flex items-center justify-center shrink-0 shadow-sm">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#171717]">✈️ Flight / Transit Fare Estimate:</span>
              <span className="font-black text-[#171717]">
                {trip.flight_ticket_estimate?.cost === 0
                  ? 'Zero (Intra-City Outing)'
                  : formatCurrency(trip.flight_ticket_estimate?.cost || (trip.destination.toLowerCase().includes('saudi') ? 26000 : 5800), trip.currency, true)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 font-bold border border-orange-200">
                AI Live Rate
              </span>
            </div>
            <p className="text-[11px] text-[#525252] mt-0.5">
              {trip.flight_ticket_estimate?.description || `Estimated flight charges for ${trip.origin} ➔ ${trip.destination}`}
              {trip.flight_ticket_estimate?.airlines ? ` • Airlines: ${trip.flight_ticket_estimate.airlines}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider">Total Planned Budget</p>
          <p className="text-2xl font-black text-[#171717] mt-1">
            {formatCurrency(budget, trip.currency)}{' '}
            <span className="text-xs font-normal text-[#525252]">{trip.currency}</span>
          </p>
          <p className="text-xs text-[#525252] mt-1">For {trip.traveler_count} travelers ({trip.duration_days} days)</p>
        </div>

        {/* Total Spent */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-card">
          <p className="text-xs font-semibold text-[#171717] uppercase tracking-wider">Total Allocated</p>
          <p className="text-2xl font-black text-[#F97316] mt-1">
            {formatCurrency(totalSpent, trip.currency)}{' '}
            <span className="text-xs font-normal text-[#525252]">{trip.currency}</span>
          </p>
          <div className="w-full bg-[#F3F4F6] rounded-full h-2 mt-2 overflow-hidden border border-[#E5E7EB]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentSpent > 90 ? 'bg-[#DC2626]' : 'bg-[#F97316]'
              }`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className={`p-4 rounded-2xl border ${remaining >= 0 ? 'bg-[#F3F4F6] border-[#E5E7EB]' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${remaining >= 0 ? 'text-[#171717]' : 'text-[#DC2626]'}`}>
            {remaining >= 0 ? 'Remaining Balance' : 'Budget Overrun'}
          </p>
          <p className={`text-2xl font-black mt-1 ${remaining >= 0 ? 'text-[#171717]' : 'text-[#DC2626]'}`}>
            {formatCurrency(Math.abs(remaining), trip.currency)}{' '}
            <span className="text-xs font-normal text-[#525252]">{trip.currency}</span>
          </p>
          <p className={`text-xs mt-1 ${remaining >= 0 ? 'text-[#525252]' : 'text-[#DC2626]'}`}>
            {remaining >= 0 ? `${100 - percentSpent}% of funds available` : 'Exceeds target budget limit'}
          </p>
        </div>
      </div>

      {/* Quick Add Expense Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">New Expense Entry</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-[#525252] hover:text-[#171717]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                placeholder="Description (e.g. Flight tickets, Hotel booking)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder={`Amount (${getCurrencySymbol(trip.currency)})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="flights">Flights</option>
                <option value="accommodation">Accommodation</option>
                <option value="transport">Transport</option>
                <option value="activities">Activities</option>
                <option value="food">Food & Dining</option>
                <option value="shopping">Shopping</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Chart & Expense List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Visual Chart */}
        <div className="lg:col-span-7 bg-[#F3F4F6]/50 rounded-2xl border border-[#E5E7EB] p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-bold text-[#171717] mb-2 self-start">Spending by Category</p>
          {chartData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value), trip.currency), 'Amount']} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value), trip.currency), 'Amount']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-[#525252]">
              No expense items recorded yet.
            </div>
          )}
        </div>

        {/* Expense Items List */}
        <div className="lg:col-span-5 space-y-2 max-h-80 overflow-y-auto pr-1">
          <p className="text-xs font-bold text-[#171717] mb-2">Itemized Records ({expenses.length})</p>
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#525252] bg-[#F3F4F6] rounded-2xl border border-[#E5E7EB]">
              No expenses logged yet.
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:border-[#F97316]/50 bg-white shadow-card transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#737373' }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#171717] line-clamp-1">{exp.description}</p>
                    <p className="text-[10px] text-[#525252] capitalize">{exp.category} {exp.date ? `• ${exp.date}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#171717]">{formatCurrency(exp.amount, exp.currency || trip.currency)}</span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-[#DC2626] transition-opacity"
                    title="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
