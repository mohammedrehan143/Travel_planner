import React, { useState } from 'react';
import { CheckSquare, Square, Plus, CheckCircle2, Luggage } from 'lucide-react';
import { ChecklistItem } from '../../types';
import { useTrips } from '../../context/TripContext';

interface PackingChecklistProps {
  items: ChecklistItem[];
}

export const PackingChecklist: React.FC<PackingChecklistProps> = ({ items }) => {
  const { toggleChecklistItem, addChecklistItem } = useTrips();
  const [newItemText, setNewItemText] = useState('');
  const [category, setCategory] = useState<ChecklistItem['category']>('Essentials');

  const completedCount = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addChecklistItem(newItemText.trim(), category);
    setNewItemText('');
  };

  const categories: ChecklistItem['category'][] = [
    'Essentials',
    'Documents',
    'Tech',
    'Clothing',
    'Health',
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
      {/* Header & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Luggage className="w-5 h-5 text-blue-600" />
            Packing & Travel Readiness Checklist
          </h3>
          <p className="text-xs text-slate-500">
            Smart pre-departure preparation tailored to international and regional travel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">
              {completedCount} of {items.length} items packed
            </span>
            <div className="w-32 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
            {pct}%
          </span>
        </div>
      </div>

      {/* Add New Item */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Add custom packing item (e.g. Travel adapter, Sunscreen)..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ChecklistItem['category'])}
          className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Checklist Grid by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {cat} ({catItems.filter((i) => i.completed).length}/{catItems.length})
              </span>

              <div className="space-y-1.5">
                {catItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition-colors group cursor-pointer"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        item.completed
                          ? 'line-through text-slate-400 font-normal'
                          : 'text-slate-800 font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
