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
  BarChart3
} from 'lucide-react';
import { Trip, TripExpense, ExpenseCategory } from '../../types';
import { useTrips } from '../../context/TripContext';

interface BudgetTrackerProps {
  trip: Trip;
  expenses: TripExpense[];
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  flights: '#3b82f6',        // Blue
  accommodation: '#8b5cf6',  // Purple
  activities: '#06b6d4',     // Cyan
  food: '#f59e0b',           // Amber
  transport: '#10b981',      // Emerald
  shopping: '#ec4899',       // Pink
  insurance: '#64748b',      // Slate
  other: '#94a3b8',          // Gray
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
      color: CATEGORY_COLORS[cat as ExpenseCategory] || '#94a3b8',
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
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Title & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Trip Budget & Expense Tracker
          </h3>
          <p className="text-xs text-slate-500">
            Real-time financial breakdown across flights, lodging, dining, and activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart view toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Pie</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Planned Budget</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ${budget.toLocaleString()} <span className="text-xs font-normal text-slate-500">{trip.currency}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">For {trip.traveler_count} travelers ({trip.duration_days} days)</p>
        </div>

        {/* Total Spent */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Allocated</p>
          <p className="text-2xl font-black text-blue-900 mt-1">
            ${totalSpent.toLocaleString()} <span className="text-xs font-normal text-blue-600">{trip.currency}</span>
          </p>
          <div className="w-full bg-blue-200/60 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentSpent > 90 ? 'bg-rose-500' : percentSpent > 75 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className={`p-4 rounded-2xl border ${remaining >= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {remaining >= 0 ? 'Remaining Balance' : 'Budget Overrun'}
          </p>
          <p className={`text-2xl font-black mt-1 ${remaining >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            ${Math.abs(remaining).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">{trip.currency}</span>
          </p>
          <p className={`text-xs mt-1 ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {remaining >= 0 ? `${100 - percentSpent}% of funds available` : 'Exceeds target budget limit'}
          </p>
        </div>
      </div>

      {/* Quick Add Expense Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">New Expense Entry</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Chart & Expense List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Visual Chart */}
        <div className="lg:col-span-7 bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-bold text-slate-700 mb-2 self-start">Spending by Category</p>
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
                    <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
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
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No expense items recorded yet.
            </div>
          )}
        </div>

        {/* Expense Items List */}
        <div className="lg:col-span-5 space-y-2 max-h-80 overflow-y-auto pr-1">
          <p className="text-xs font-bold text-slate-700 mb-2">Itemized Records ({expenses.length})</p>
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              No expenses logged yet.
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#94a3b8' }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-1">{exp.description}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{exp.category} {exp.date ? `• ${exp.date}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">${exp.amount.toLocaleString()}</span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
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
