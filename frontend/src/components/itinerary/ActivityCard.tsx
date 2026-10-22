import React from 'react';
import {
  Clock,
  MapPin,
  DollarSign,
  Ticket,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  ExternalLink,
  Utensils,
  Landmark,
  Compass,
  Trees,
  ShoppingBag,
  Sparkles,
  Coffee
} from 'lucide-react';
import { Activity, ActivityCategory } from '../../types';
import { formatCurrency } from '../../lib/currency';

interface ActivityCardProps {
  activity: Activity;
  index: number;
  totalActivities: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  cultural: {
    label: 'Cultural',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    icon: <Landmark className="w-3.5 h-3.5" />,
  },
  dining: {
    label: 'Dining',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    icon: <Utensils className="w-3.5 h-3.5" />,
  },
  sightseeing: {
    label: 'Sightseeing',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  outdoor: {
    label: 'Outdoor',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    icon: <Trees className="w-3.5 h-3.5" />,
  },
  shopping: {
    label: 'Shopping',
    bg: 'bg-pink-50 border-pink-200',
    text: 'text-pink-700',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
  entertainment: {
    label: 'Entertainment',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-700',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  relaxation: {
    label: 'Hangout & Relax',
    bg: 'bg-teal-50 border-teal-200',
    text: 'text-teal-700',
    icon: <Coffee className="w-3.5 h-3.5" />,
  },
  transit: {
    label: 'Traveling',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  totalActivities,
  isSelected = true,
  onToggleSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.sightseeing;

  // Extract speciality or dietary from notes if present
  let displaySpeciality = activity.speciality;
  let displayDietary = activity.dietary_tag;

  if (activity.notes) {
    if (!displaySpeciality && activity.notes.includes('Speciality:')) {
      const match = activity.notes.match(/Speciality:\s*([^|•]+)/i);
      if (match) displaySpeciality = match[1].trim();
    }
    if (!displayDietary && activity.notes.includes('Dietary:')) {
      const match = activity.notes.match(/Dietary:\s*([^|•]+)/i);
      if (match) {
        const d = match[1].trim().toLowerCase();
        if (d.includes('veg') && !d.includes('non')) displayDietary = 'veg';
        else if (d.includes('non')) displayDietary = 'non_veg';
        else displayDietary = 'both';
      }
    }
  }

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      isSelected
        ? 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300'
        : 'border-slate-200 opacity-60 bg-slate-50/50'
    }`}>
      {/* Top status bar accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          {/* Activity Selection Checkbox */}
          {onToggleSelect && (
            <label className="flex items-center cursor-pointer select-none" title="Select to include in final trip">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
              />
            </label>
          )}

          {/* Order Badge */}
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {activity.start_time} - {activity.end_time}
            </span>
            <span className="text-slate-400 font-normal">({activity.duration_minutes}m)</span>
          </div>

          {/* Category Tag */}
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${catConfig.bg} ${catConfig.text}`}
          >
            {catConfig.icon}
            <span>{catConfig.label}</span>
          </div>

          {/* Dietary Tag Badge */}
          {displayDietary && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                displayDietary === 'veg'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : displayDietary === 'non_veg'
                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                  : 'bg-teal-50 text-teal-800 border-teal-300'
              }`}
            >
              {displayDietary === 'veg' ? '🥬 Pure Veg' : displayDietary === 'non_veg' ? '🍗 Non-Veg' : '🥗 Veg & Non-Veg'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {/* Move Up / Down */}
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              title="Move activity earlier"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={index === totalActivities - 1}
              title="Move activity later"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(activity)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit activity"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(activity.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Remove activity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {activity.title}
          </h4>

          {displaySpeciality && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50/90 border border-amber-200 text-xs font-bold text-amber-900 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Speciality: {displaySpeciality}</span>
            </div>
          )}
        </div>

        {activity.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
        )}

        {/* Location & Address */}
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">{activity.location_name}</span>
            {activity.location_address && (
              <span className="block text-slate-500">{activity.location_address}</span>
            )}
          </div>
        </div>

        {/* Notes */}
        {activity.notes && (
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-normal">
            <span className="font-semibold">Local tip: </span>
            {activity.notes}
          </div>
        )}

        {/* Footer Meta: Cost & Booking */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-900">
            <span>
              {activity.estimated_cost === 0
                ? 'Free entry'
                : `Est. ${formatCurrency(activity.estimated_cost, activity.currency)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activity.booking_status === 'booked' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                <Ticket className="w-3 h-3 text-emerald-600" />
                Booked
              </span>
            ) : activity.booking_required ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                <Ticket className="w-3 h-3 text-amber-600" />
                Booking Required
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">No reservation needed</span>
            )}

            {activity.booking_url && (
              <a
                href={activity.booking_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline ml-1"
              >
                <span>Tickets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
