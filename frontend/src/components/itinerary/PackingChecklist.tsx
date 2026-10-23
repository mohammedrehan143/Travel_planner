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
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6 space-y-6 text-[#171717]">
      {/* Header & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h3 className="text-lg font-bold text-[#171717] flex items-center gap-2">
            <Luggage className="w-5 h-5 text-[#F97316]" />
            Packing & Travel Readiness Checklist
          </h3>
          <p className="text-xs text-[#525252]">
            Smart pre-departure preparation tailored to international and regional travel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-[#525252]">
              {completedCount} of {items.length} items packed
            </span>
            <div className="w-32 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-[#F97316] h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-[#171717] bg-[#F3F4F6] px-2.5 py-1 rounded-xl border border-[#E5E7EB]">
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
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ChecklistItem['category'])}
          className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#171717] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors shrink-0 active:scale-95"
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
            <div key={cat} className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] space-y-2.5">
              <span className="text-xs font-bold text-[#171717] uppercase tracking-wider block">
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
                      <CheckSquare className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316] shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        item.completed
                          ? 'line-through text-[#737373] font-normal'
                          : 'text-[#171717] font-medium'
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
